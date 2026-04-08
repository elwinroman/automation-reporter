import type { TestExecution } from './TestExecution.js'

/** Metadatos de generacion del reporte. */
export interface ReportMetadata {
  generatedAt: string;
  sourceDirectory: string;
  totalFilesProcessed: number;
}

/** Resumen global de todas las ejecuciones procesadas. */
export interface GlobalSummary {
  totalExecutions: number;
  /** Cantidad de test cases unicos por nombre. */
  uniqueTestCases: number;
  /** Cantidad total de ejecuciones de test case, incluyendo repetidos entre corridas. */
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

/** Test case individual dentro de una ejecucion de producto. */
export interface ProductRunTestCase {
  name: string;
  status: 'passed' | 'failed';
  /** Duracion en segundos. */
  time: number;
  failureMessages: string[];
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
  /** Path completo de esta ejecucion. Ej: "Creditos\Otorgamiento\Agricola" */
  path: string;
  /** Ruta absoluta al index.html del reporte de esta ejecucion. */
  indexHtml: string;
  /** Test cases ejecutados en esta ejecucion. */
  testCases: ProductRunTestCase[];
}

/** Estadisticas agregadas por producto, incluyendo el historial de ejecuciones. */
export interface ProductSummary {
  product: string;
  category: string;
  executionCount: number;
  passRate: number;
  runs: ProductRun[];
  /**
   * Union de todos los segmentos de path encontrados en las ejecuciones de este producto.
   * Ej: ["Creditos", "Reprogramacion", "Rural"] o ["Creditos", "Refinanciamiento", "Rural"]
   * cuando el mismo nombre de producto aparece bajo distintos sub-paths.
   */
  tags: string[];
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
