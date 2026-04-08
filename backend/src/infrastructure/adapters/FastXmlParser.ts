import fs from 'node:fs/promises'
import path from 'node:path'
import { XMLParser } from 'fast-xml-parser'
import type { XmlParser, ParsedTestSuites } from '../../domain/ports/index.js'
import type { TestSuite, TestCase } from '../../domain/entities/index.js'

interface RawFailure {
  '@_message'?: string;
}

interface RawTestCase {
  '@_name': string;
  '@_classname': string;
  '@_time': string;
  failure?: RawFailure[];
}

interface RawTestSuite {
  '@_name': string;
  '@_tests': string;
  '@_failures': string;
  '@_errors': string;
  '@_hostname': string;
  '@_time': string;
  '@_timestamp': string;
  testcase?: RawTestCase[];
}

interface RawTestSuites {
  '@_name': string;
  '@_tests': string;
  '@_failures': string;
  '@_errors': string;
  '@_time': string;
  testsuite?: RawTestSuite[];
}

interface LegacyTime {
  msec?: number;
  text?: string;
}

interface LegacyRootProvider {
  href?: string;
}

interface LegacyRootNode {
  name?: string;
  status?: number;
  providers?: LegacyRootProvider[];
  children?: LegacyRootNode[];
}

interface LegacyRootLog {
  info?: {
    computerName?: string;
    startTime?: string;
  };
  children?: LegacyRootNode[];
}

interface LegacyProjectLogItem {
  Status?: string;
  Name?: string;
  StartTime?: LegacyTime;
  RunTime?: LegacyTime;
}

interface LegacyProjectLog {
  items?: LegacyProjectLogItem[];
}

interface LegacyTestLogItem {
  Type?: string;
  TypeDescription?: string;
  Message?: string;
  TimeWithChildrensec?: number;
  Details?: {
    text?: string;
    isfilename?: boolean;
  };
}

interface LegacyTestLog {
  items?: LegacyTestLogItem[];
}

interface LegacyCaseResult {
  testCase: TestCase;
  status: 'passed' | 'failed';
}

const JSONP_REGEX = /_json_loaded\(\s*"[^"]*"\s*,\s*([\s\S]+)\s*\)\s*$/
const LEGACY_FAILURE_TYPE_REGEX = /(error|fail)/i
const LEGACY_SUCCESS_STATUS = new Set(['success', 'succeeded test', 'ok', 'checkpoint'])

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
}

function parseJsonp<T>(content: string): T {
  const match = content.match(JSONP_REGEX)
  if (!match) {
    throw new Error('Formato JSONP legacy invalido')
  }

  return JSON.parse(match[1]) as T
}

function normalizeLegacyName(value: string | undefined): string {
  return decodeXmlEntities(value ?? '').trim()
}

function findProviderHref(node: LegacyRootNode | undefined): string | undefined {
  return node?.providers?.find((provider) => provider.href?.endsWith('_TestLog.js'))?.href
}

function collectLeafNodes(node: LegacyRootNode): LegacyRootNode[] {
  const children = node.children ?? []
  if (children.length === 0) {
    return [node]
  }

  return children.flatMap((child) => collectLeafNodes(child))
}

/**
 * Implementacion de {@link XmlParser} con soporte para JUnit XML y logs HTML legacy de TestComplete.
 */
export class FastXmlParserAdapter implements XmlParser {
  private parser: XMLParser

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => ['testsuite', 'testcase', 'failure'].includes(name),
    })
  }

  async parse(content: string, sourcePath: string): Promise<ParsedTestSuites> {
    if (path.basename(sourcePath) === '_root.js') {
      return this.parseLegacyRoot(content, sourcePath)
    }

    return this.parseXml(content)
  }

  private parseXml(xmlContent: string): ParsedTestSuites {
    const parsed = this.parser.parse(xmlContent)
    const raw: RawTestSuites = parsed.testsuites

    const suites: TestSuite[] = (raw.testsuite ?? []).map((rs) => this.mapSuite(rs))

    return {
      name: decodeXmlEntities(raw['@_name']),
      tests: parseInt(raw['@_tests']),
      failures: parseInt(raw['@_failures']),
      errors: parseInt(raw['@_errors']),
      time: parseFloat(raw['@_time']),
      suites,
    }
  }

  private async parseLegacyRoot(content: string, sourcePath: string): Promise<ParsedTestSuites> {
    const rootLog = parseJsonp<LegacyRootLog>(content)
    const rootDir = path.dirname(sourcePath)
    const projectLog = await this.tryReadJsonp<LegacyProjectLog>(path.join(rootDir, '_ProjectLog.js'))
    const hostname = rootLog.info?.computerName ?? ''
    const timestamp = this.toIsoTimestamp(rootLog.info?.startTime)
    const suites: TestSuite[] = []

    for (const suiteNode of rootLog.children ?? []) {
      const suiteName = normalizeLegacyName(suiteNode.name) || 'Unnamed suite'
      const projectItem = projectLog?.items?.find((item) => normalizeLegacyName(item.Name) === suiteName)
      const leafNodes = collectLeafNodes(suiteNode)
      const cases = await Promise.all(
        leafNodes.map((leafNode) => this.buildLegacyCase(rootDir, leafNode, suiteName)),
      )
      const testCases = cases.map((entry) => entry.testCase)
      const failures = cases.filter((entry) => entry.status === 'failed').length
      const runtimeMs = projectItem?.RunTime?.msec
      const suiteTimestamp = projectItem?.StartTime?.msec

      suites.push({
        name: suiteName,
        tests: testCases.length,
        failures,
        errors: 0,
        time: typeof runtimeMs === 'number'
          ? runtimeMs / 1000
          : testCases.reduce((total, testCase) => total + testCase.time, 0),
        hostname,
        timestamp: typeof suiteTimestamp === 'number' ? new Date(suiteTimestamp).toISOString() : timestamp,
        testCases,
      })
    }

    return {
      name: 'TestComplete Legacy Report',
      tests: suites.reduce((total, suite) => total + suite.tests, 0),
      failures: suites.reduce((total, suite) => total + suite.failures, 0),
      errors: 0,
      time: suites.reduce((total, suite) => total + suite.time, 0),
      suites,
    }
  }

  private async buildLegacyCase(
    rootDir: string,
    node: LegacyRootNode,
    fallbackClassname: string,
  ): Promise<LegacyCaseResult> {
    const testName = normalizeLegacyName(node.name) || 'Unnamed test'
    const providerHref = findProviderHref(node)
    const testLog = providerHref
      ? await this.tryReadJsonp<LegacyTestLog>(path.join(rootDir, providerHref))
      : null
    const failureMessages = this.extractLegacyFailureMessages(testLog)
    const status: 'passed' | 'failed' = (node.status ?? 0) !== 0 || failureMessages.length > 0 ? 'failed' : 'passed'

    return {
      status,
      testCase: {
        name: testName,
        classname: fallbackClassname,
        time: this.extractLegacyDuration(testLog),
        status,
        failureMessages,
      },
    }
  }

  private extractLegacyFailureMessages(testLog: LegacyTestLog | null): string[] {
    if (!testLog?.items) {
      return []
    }

    return testLog.items
      .filter((item) => this.isLegacyFailureItem(item))
      .map((item) => {
        const parts = [normalizeLegacyName(item.TypeDescription ?? item.Type), normalizeLegacyName(item.Message)]
        const details = item.Details?.isfilename ? '' : normalizeLegacyName(item.Details?.text)
        if (details) {
          parts.push(details)
        }
        return parts.filter(Boolean).join(': ')
      })
      .filter(Boolean)
  }

  private isLegacyFailureItem(item: LegacyTestLogItem): boolean {
    const type = normalizeLegacyName(item.Type).toLowerCase()
    const typeDescription = normalizeLegacyName(item.TypeDescription)

    if (LEGACY_FAILURE_TYPE_REGEX.test(type) || LEGACY_FAILURE_TYPE_REGEX.test(typeDescription)) {
      return true
    }

    return Boolean(type) && !LEGACY_SUCCESS_STATUS.has(type) && type.includes('error')
  }

  private extractLegacyDuration(testLog: LegacyTestLog | null): number {
    const duration = testLog?.items?.[0]?.TimeWithChildrensec
    return typeof duration === 'number' && Number.isFinite(duration) ? duration : 0
  }

  private toIsoTimestamp(rawTimestamp: string | undefined): string {
    const timestamp = rawTimestamp ? parseInt(rawTimestamp, 10) : NaN
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : ''
  }

  private async tryReadJsonp<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return parseJsonp<T>(content)
    } catch {
      return null
    }
  }

  private mapSuite(raw: RawTestSuite): TestSuite {
    const testCases: TestCase[] = (raw.testcase ?? []).map((rtc) => this.mapTestCase(rtc))

    return {
      name: decodeXmlEntities(raw['@_name']),
      tests: parseInt(raw['@_tests']),
      failures: parseInt(raw['@_failures']),
      errors: parseInt(raw['@_errors']),
      time: parseFloat(raw['@_time']),
      hostname: raw['@_hostname'],
      timestamp: raw['@_timestamp'],
      testCases,
    }
  }

  private mapTestCase(raw: RawTestCase): TestCase {
    const failures = raw.failure ?? []
    const failureMessages = failures
      .map((f) => decodeXmlEntities(f['@_message'] ?? ''))
      .filter((msg) => msg.length > 0)

    return {
      name: decodeXmlEntities(raw['@_name']),
      classname: decodeXmlEntities(raw['@_classname']),
      time: parseFloat(raw['@_time']),
      status: failures.length > 0 ? 'failed' : 'passed',
      failureMessages,
    }
  }
}
