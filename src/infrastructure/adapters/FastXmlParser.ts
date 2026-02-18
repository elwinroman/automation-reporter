import { XMLParser } from 'fast-xml-parser';
import type { XmlParser, ParsedTestSuites } from '../../domain/ports/index.js';
import type { TestSuite, TestCase } from '../../domain/entities/index.js';

// --- Tipos internos que mapean la estructura raw del XML con atributos prefijados por '@_' ---

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

/**
 * Implementacion de {@link XmlParser} usando fast-xml-parser.
 * Mapea la estructura JUnit XML (`<testsuites>` -> `<testsuite>` -> `<testcase>`) a entidades de dominio.
 * El status de un test se determina por la presencia de elementos `<failure>`.
 */
export class FastXmlParserAdapter implements XmlParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => {
        return ['testsuite', 'testcase', 'failure'].includes(name);
      },
    });
  }

  parse(xmlContent: string): ParsedTestSuites {
    const parsed = this.parser.parse(xmlContent);
    const raw: RawTestSuites = parsed.testsuites;

    const suites: TestSuite[] = (raw.testsuite ?? []).map((rs) => this.mapSuite(rs));

    return {
      name: raw['@_name'],
      tests: parseInt(raw['@_tests']),
      failures: parseInt(raw['@_failures']),
      errors: parseInt(raw['@_errors']),
      time: parseFloat(raw['@_time']),
      suites,
    };
  }

  private mapSuite(raw: RawTestSuite): TestSuite {
    const testCases: TestCase[] = (raw.testcase ?? []).map((rtc) => this.mapTestCase(rtc));

    return {
      name: raw['@_name'],
      tests: parseInt(raw['@_tests']),
      failures: parseInt(raw['@_failures']),
      errors: parseInt(raw['@_errors']),
      time: parseFloat(raw['@_time']),
      hostname: raw['@_hostname'],
      timestamp: raw['@_timestamp'],
      testCases,
    };
  }

  private mapTestCase(raw: RawTestCase): TestCase {
    const failures = raw.failure ?? [];
    const failureMessages = failures
      .map((f) => f['@_message'] ?? '')
      .filter((msg) => msg.length > 0);

    return {
      name: raw['@_name'],
      classname: raw['@_classname'],
      time: parseFloat(raw['@_time']),
      status: failures.length > 0 ? 'failed' : 'passed',
      failureMessages,
    };
  }
}
