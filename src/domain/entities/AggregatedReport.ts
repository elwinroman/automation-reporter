import type { TestExecution } from './TestExecution.js';

/** Metadatos de generacion del reporte. */
export interface ReportMetadata {
  generatedAt: string;
  sourceDirectory: string;
  totalFilesProcessed: number;
}

/** Resumen global de todas las ejecuciones procesadas. */
export interface GlobalSummary {
  totalExecutions: number;
  totalTestCases: number;
  totalPassed: number;
  totalFailed: number;
  /** Porcentaje de exito (0-100, redondeado a 2 decimales). */
  globalPassRate: number;
  /** Tiempo total acumulado en segundos. */
  totalTime: number;
  /** Rango de fechas ISO de la ejecucion mas antigua a la mas reciente. */
  dateRange: {
    from: string;
    to: string;
  };
}

/** Estadisticas agregadas por categoria. */
export interface CategorySummary {
  category: string;
  executionCount: number;
  /** Porcentaje de exito (0-100). */
  passRate: number;
  totalTime: number;
}

/** Resultado de una ejecucion individual dentro de un producto. */
export interface ProductRun {
  folderName: string;
  executionDate: string;
  tests: number;
  passed: number;
  failed: number;
  /** Tiempo en segundos. */
  time: number;
}

/** Estadisticas agregadas por producto, incluyendo el historial de ejecuciones. */
export interface ProductSummary {
  product: string;
  category: string;
  executionCount: number;
  passRate: number;
  runs: ProductRun[];
}

/**
 * Test case agregado a traves de multiples ejecuciones.
 * Permite identificar tests flaky, lentos o con fallos recurrentes.
 */
export interface AggregatedTestCase {
  testCaseName: string;
  executionCount: number;
  passCount: number;
  failCount: number;
  /** Porcentaje de exito (0-100). Un valor entre 0 y 100 exclusivo indica flakiness. */
  passRate: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  /** Productos en los que este test case aparece. */
  products: string[];
  /** Mensajes de fallo unicos recopilados de todas las ejecuciones. */
  distinctFailureMessages: string[];
}

/**
 * Reporte completo generado a partir de archivos summary.xml.
 * Estructura principal que consume el frontend via tRPC.
 */
export interface AggregatedReport {
  reportMetadata: ReportMetadata;
  globalSummary: GlobalSummary;
  categories: CategorySummary[];
  products: ProductSummary[];
  testCases: AggregatedTestCase[];
  executions: TestExecution[];
}
