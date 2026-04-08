import path from 'node:path'
import type {
  TestExecution,
  AggregatedReport,
  CategorySummary,
  ProductSummary,
  GlobalSummary,
} from '../../domain/entities/index.js'
import { aggregateTestCases } from './TestCaseAggregator.js'

/**
 * Ensambla un {@link AggregatedReport} completo a partir de las ejecuciones parseadas.
 * Orquesta las sub-construcciones: globalSummary, categories, products y testCases.
 */
export function assembleReport(
  executions: TestExecution[],
  sourceDirectory: string,
  logsDirectory?: string,
): AggregatedReport {
  const globalSummary = buildGlobalSummary(executions)
  const categories = buildCategories(executions)
  const products = buildProducts(executions, logsDirectory)
  const testCases = aggregateTestCases(executions)

  return {
    reportMetadata: {
      generatedAt: new Date().toISOString(),
      sourceDirectory,
      totalFilesProcessed: executions.length,
    },
    globalSummary,
    categories,
    products,
    testCases,
    executions,
  }
}

function buildGlobalSummary(executions: TestExecution[]): GlobalSummary {
  let totalTestCases = 0
  let totalPassed = 0
  let totalFailed = 0
  let totalTime = 0

  const dates: Date[] = []

  for (const exec of executions) {
    for (const suite of exec.suites) {
      for (const tc of suite.testCases) {
        totalTestCases++
        if (tc.status === 'passed') totalPassed++
        else totalFailed++
      }
    }
    totalTime += exec.totalTime
    dates.push(exec.metadata.executionDate)
  }

  dates.sort((a, b) => a.getTime() - b.getTime())

  return {
    totalExecutions: executions.length,
    totalTestCases,
    totalPassed,
    totalFailed,
    globalPassRate: totalTestCases > 0
      ? Math.round((totalPassed / totalTestCases) * 10000) / 100
      : 0,
    totalTime,
    dateRange: {
      from: dates.length > 0 ? dates[0].toISOString() : '',
      to: dates.length > 0 ? dates[dates.length - 1].toISOString() : '',
    },
  }
}

function buildCategories(executions: TestExecution[]): CategorySummary[] {
  const map = new Map<string, { passed: number; total: number; time: number; count: number }>()

  for (const exec of executions) {
    const cat = exec.metadata.category
    let entry = map.get(cat)
    if (!entry) {
      entry = { passed: 0, total: 0, time: 0, count: 0 }
      map.set(cat, entry)
    }
    entry.count++
    entry.time += exec.totalTime

    for (const suite of exec.suites) {
      for (const tc of suite.testCases) {
        entry.total++
        if (tc.status === 'passed') entry.passed++
      }
    }
  }

  return [...map.entries()]
    .map(([category, entry]) => ({
      category,
      executionCount: entry.count,
      passRate: entry.total > 0
        ? Math.round((entry.passed / entry.total) * 10000) / 100
        : 0,
      totalTime: entry.time,
    }))
    .sort((a, b) => a.category.localeCompare(b.category))
}

function buildProducts(executions: TestExecution[], logsDirectory?: string): ProductSummary[] {
  const map = new Map<string, {
    category: string;
    passed: number;
    total: number;
    tags: Set<string>;
    runs: {
      folderName: string;
      executionDate: string;
      tests: number;
      passed: number;
      failed: number;
      time: number;
      path: string;
      indexHtml: string;
      testCases: { name: string; status: 'passed' | 'failed'; time: number; failureMessages: string[] }[];
    }[];
  }>()

  for (const exec of executions) {
    const key = exec.metadata.product
    let entry = map.get(key)
    if (!entry) {
      entry = { category: exec.metadata.category, passed: 0, total: 0, tags: new Set(), runs: [] }
      map.set(key, entry)
    }

    for (const tag of exec.metadata.tags) {
      entry.tags.add(tag)
    }

    let runPassed = 0
    let runTotal = 0

    for (const suite of exec.suites) {
      for (const tc of suite.testCases) {
        runTotal++
        entry.total++
        if (tc.status === 'passed') {
          runPassed++
          entry.passed++
        }
      }
    }

    entry.runs.push({
      folderName: exec.metadata.rawFolderName,
      executionDate: exec.metadata.executionDate.toISOString(),
      tests: runTotal,
      passed: runPassed,
      failed: runTotal - runPassed,
      time: exec.totalTime,
      path: exec.metadata.tags.join('\\'),
      indexHtml: logsDirectory
        ? path.relative(logsDirectory, path.join(path.dirname(exec.filePath), 'index.html'))
        : path.join(path.dirname(exec.filePath), 'index.html'),
      testCases: exec.suites.flatMap((s) =>
        s.testCases.map((tc) => ({
          name: tc.name,
          status: tc.status,
          time: tc.time,
          failureMessages: tc.failureMessages,
        })),
      ),
    })
  }

  return [...map.entries()]
    .map(([product, entry]) => ({
      product,
      category: entry.category,
      executionCount: entry.runs.length,
      passRate: entry.total > 0
        ? Math.round((entry.passed / entry.total) * 10000) / 100
        : 0,
      runs: entry.runs,
      tags: [...entry.tags],
    }))
    .sort((a, b) => a.product.localeCompare(b.product))
}
