import type { TestExecution, AggregatedTestCase } from '../../domain/entities/index.js'

/**
 * Agrupa test cases por nombre a traves de todas las ejecuciones y calcula
 * estadisticas: pass/fail count, pass rate, tiempos (avg/min/max),
 * productos involucrados y mensajes de fallo unicos.
 * Resultado ordenado por cantidad de ejecuciones (descendente).
 */
export function aggregateTestCases(executions: TestExecution[]): AggregatedTestCase[] {
  const map = new Map<string, {
    passCount: number;
    failCount: number;
    times: number[];
    products: Set<string>;
    failureMessages: Set<string>;
  }>()

  for (const execution of executions) {
    for (const suite of execution.suites) {
      for (const tc of suite.testCases) {
        let entry = map.get(tc.name)
        if (!entry) {
          entry = {
            passCount: 0,
            failCount: 0,
            times: [],
            products: new Set(),
            failureMessages: new Set(),
          }
          map.set(tc.name, entry)
        }

        if (tc.status === 'passed') {
          entry.passCount++
        } else {
          entry.failCount++
        }

        entry.times.push(tc.time)
        entry.products.add(execution.metadata.product)

        for (const msg of tc.failureMessages) {
          entry.failureMessages.add(msg)
        }
      }
    }
  }

  const result: AggregatedTestCase[] = []

  for (const [testCaseName, entry] of map) {
    const executionCount = entry.passCount + entry.failCount
    const totalTime = entry.times.reduce((a, b) => a + b, 0)

    result.push({
      testCaseName,
      executionCount,
      passCount: entry.passCount,
      failCount: entry.failCount,
      passRate: executionCount > 0 ? Math.round((entry.passCount / executionCount) * 10000) / 100 : 0,
      totalTime,
      avgTime: executionCount > 0 ? Math.round((totalTime / executionCount) * 100) / 100 : 0,
      minTime: Math.min(...entry.times),
      maxTime: Math.max(...entry.times),
      products: [...entry.products].sort(),
      distinctFailureMessages: [...entry.failureMessages],
    })
  }

  return result.sort((a, b) => b.executionCount - a.executionCount)
}
