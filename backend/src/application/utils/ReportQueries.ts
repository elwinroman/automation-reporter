/**
 * Funciones de consulta sobre un AggregatedReport.
 *
 * Toda la logica de filtrado, ordenamiento, paginacion y agrupacion
 * vive aqui, desacoplada de la capa de transporte (tRPC, CLI, etc.).
 */
import type {
  AggregatedReport,
  GlobalSummary,
  CategorySummary,
  ProductSummary,
  AggregatedTestCase,
} from '../../domain/entities/index.js'

// ── Shared result types ─────────────────────────────────────────

/** Envoltorio generico para respuestas paginadas. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/** Agrupacion de fallos por mensaje de error, con conteo y tests/productos afectados. */
export interface FailureGroup {
  message: string;
  occurrences: number;
  affectedTests: string[];
  affectedProducts: string[];
}

/** Detalle de un producto con sus test cases relacionados. */
export type ProductDetailResult = ProductSummary & {
  relatedTestCases: AggregatedTestCase[];
};

/** Vista resumida de producto para listados, sin historial de ejecuciones. */
export type ProductListItem = Omit<ProductSummary, 'runs'>;

// ── Filter param interfaces ─────────────────────────────────────

interface DateRange {
  from?: string;
  to?: string;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface PaginationConfig {
  limit?: number;
  offset?: number;
}

export interface GlobalSummaryFilters {
  dateRange?: DateRange;
}

export interface CategoriesFilters {
  category?: string;
  sortBy?: SortConfig;
}

export interface ProductsFilters {
  category?: string;
  minPassRate?: number;
  maxPassRate?: number;
  dateRange?: DateRange;
  search?: string;
  pagination?: PaginationConfig;
  sortBy?: SortConfig;
}

export interface TestCasesFilters {
  statusType?: 'flaky' | 'always-passing' | 'always-failing' | 'all';
  product?: string;
  minPassRate?: number;
  maxPassRate?: number;
  search?: string;
  pagination?: PaginationConfig;
  sortBy?: SortConfig;
}

export interface FlakyTestsFilters {
  pagination?: PaginationConfig;
  sortBy?: SortConfig;
}

export interface SlowestTestsFilters {
  topN?: number;
  sortBy?: {
    field: 'executionCount' | 'avgTime' | 'maxTime' | 'totalTime' | 'minTime';
    direction: 'asc' | 'desc';
  };
}

export interface FailureAnalysisFilters {
  search?: string;
  pagination?: PaginationConfig;
}

// ── Internal helpers ────────────────────────────────────────────

/** Aplica paginacion sobre un array ya filtrado y ordenado. */
function paginate<T>(items: T[], config?: PaginationConfig): PaginatedResult<T> {
  const limit = config?.limit ?? 50
  const offset = config?.offset ?? 0
  const total = items.length
  return {
    items: items.slice(offset, offset + limit),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  }
}

/** Ordena por una propiedad directa del objeto (string o number). */
function sortByKey<T>(items: T[], field: string, direction: 'asc' | 'desc'): T[] {
  const multiplier = direction === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[field]
    const bVal = (b as Record<string, unknown>)[field]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * multiplier
    }
    return ((aVal as number) - (bVal as number)) * multiplier
  })
}

/** Verifica si una fecha cae dentro de un rango opcional. */
function isInDateRange(date: Date, range?: DateRange): boolean {
  if (!range) return true
  const from = range.from ? new Date(range.from) : null
  const to = range.to ? new Date(range.to) : null
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

/** Normaliza texto para comparaciones insensibles a mayusculas y tildes. */
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// ── Query functions ─────────────────────────────────────────────

/** Resumen global, opcionalmente filtrado por rango de fechas. */
export function queryGlobalSummary(
  report: AggregatedReport,
  filters?: GlobalSummaryFilters,
): GlobalSummary {
  if (!filters?.dateRange) {
    return report.globalSummary
  }

  const filteredExecutions = report.executions.filter((exec) =>
    isInDateRange(new Date(exec.metadata.executionDate.toString()), filters.dateRange),
  )

  const uniqueTestCaseNames = new Set<string>()
  let totalTestCases = 0
  let totalPassed = 0
  let totalFailed = 0
  let totalTime = 0

  for (const exec of filteredExecutions) {
    for (const suite of exec.suites) {
      for (const tc of suite.testCases) {
        uniqueTestCaseNames.add(tc.name)
        totalTestCases++
        if (tc.status === 'passed') totalPassed++
        else totalFailed++
      }
    }
    totalTime += exec.totalTime
  }

  const dates = filteredExecutions
    .map((e) => new Date(e.metadata.executionDate.toString()))
    .sort((a, b) => a.getTime() - b.getTime())

  return {
    totalExecutions: filteredExecutions.length,
    uniqueTestCases: uniqueTestCaseNames.size,
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

/** Categorias con busqueda parcial y ordenamiento. */
export function queryCategories(
  report: AggregatedReport,
  filters?: CategoriesFilters,
): CategorySummary[] {
  let result = [...report.categories]

  if (filters?.category) {
    const needle = normalizeText(filters.category)
    result = result.filter((c) => normalizeText(c.category).includes(needle))
  }

  const field = filters?.sortBy?.field ?? 'category'
  const direction = filters?.sortBy?.direction ?? 'asc'
  return sortByKey(result, field, direction)
}

/** Productos con filtros multiples, busqueda, ordenamiento y paginacion. */
export function queryProducts(
  report: AggregatedReport,
  filters?: ProductsFilters,
): PaginatedResult<ProductListItem> {
  let result = [...report.products]

  if (filters?.category) {
    const cat = normalizeText(filters.category)
    result = result.filter((p) => normalizeText(p.category) === cat)
  }

  if (filters?.minPassRate !== undefined) {
    result = result.filter((p) => p.passRate >= filters.minPassRate!)
  }
  if (filters?.maxPassRate !== undefined) {
    result = result.filter((p) => p.passRate <= filters.maxPassRate!)
  }

  if (filters?.dateRange) {
    const range = filters.dateRange
    result = result.filter((p) =>
      p.runs.some((run) => isInDateRange(new Date(run.executionDate), range)),
    )
  }

  if (filters?.search) {
    const needle = normalizeText(filters.search)
    result = result.filter((p) => normalizeText(p.product).includes(needle))
  }

  const field = filters?.sortBy?.field ?? 'product'
  const direction = filters?.sortBy?.direction ?? 'asc'
  result = sortByKey(result, field, direction)

  return paginate(
    result.map(({ runs: _runs, ...product }) => product),
    filters?.pagination,
  )
}

/** Test cases con filtros por estabilidad, producto, passRate, busqueda y paginacion. */
export function queryTestCases(
  report: AggregatedReport,
  filters?: TestCasesFilters,
): PaginatedResult<AggregatedTestCase> {
  let result = [...report.testCases]

  switch (filters?.statusType) {
  case 'flaky':
    result = result.filter((tc) => tc.passRate > 0 && tc.passRate < 100)
    break
  case 'always-passing':
    result = result.filter((tc) => tc.passRate === 100)
    break
  case 'always-failing':
    result = result.filter((tc) => tc.passRate === 0)
    break
  }

  if (filters?.product) {
    const prod = normalizeText(filters.product)
    result = result.filter((tc) =>
      tc.products.some((p) => normalizeText(p) === prod),
    )
  }

  if (filters?.minPassRate !== undefined) {
    result = result.filter((tc) => tc.passRate >= filters.minPassRate!)
  }
  if (filters?.maxPassRate !== undefined) {
    result = result.filter((tc) => tc.passRate <= filters.maxPassRate!)
  }

  if (filters?.search) {
    const needle = normalizeText(filters.search)
    result = result.filter((tc) => normalizeText(tc.testCaseName).includes(needle))
  }

  const field = filters?.sortBy?.field ?? 'executionCount'
  const direction = filters?.sortBy?.direction ?? 'desc'
  result = sortByKey(result, field, direction)

  return paginate(result, filters?.pagination)
}

/**
 * Detalle de un producto con sus test cases relacionados.
 * Retorna `null` si el producto no existe en el reporte.
 */
export function queryProductDetail(
  report: AggregatedReport,
  productName: string,
): ProductDetailResult | null {
  const normalizedProductName = normalizeText(productName)
  const product = report.products.find(
    (p) => normalizeText(p.product) === normalizedProductName,
  )

  if (!product) return null

  const relatedTestCases = report.testCases.filter((tc) =>
    tc.products.some((p) => normalizeText(p) === normalizedProductName),
  )

  return { ...product, relatedTestCases }
}

/** Tests flaky (0 < passRate < 100) con umbrales configurables y paginacion. */
export function queryFlakyTests(
  report: AggregatedReport,
  filters?: FlakyTestsFilters,
): PaginatedResult<AggregatedTestCase> {
  let result = report.testCases.filter((tc) =>
    tc.passRate > 0 &&
    tc.passRate < 100 &&
    tc.executionCount >= 2,
  )

  const field = filters?.sortBy?.field ?? 'passRate'
  const direction = filters?.sortBy?.direction ?? 'asc'
  result = sortByKey(result, field, direction)

  return paginate(result, filters?.pagination)
}

/** Top N tests mas lentos ordenados por la metrica seleccionada. */
export function querySlowestTests(
  report: AggregatedReport,
  filters?: SlowestTestsFilters,
): AggregatedTestCase[] {
  const topN = filters?.topN ?? 10
  const field = filters?.sortBy?.field ?? 'avgTime'
  const direction = filters?.sortBy?.direction ?? 'desc'
  const multiplier = direction === 'asc' ? 1 : -1

  return [...report.testCases]
    .sort((a, b) => (a[field] - b[field]) * multiplier)
    .slice(0, topN)
}

/** Analisis de fallos agrupados por mensaje de error, con filtros y paginacion. */
export function queryFailureAnalysis(
  report: AggregatedReport,
  filters?: FailureAnalysisFilters,
): PaginatedResult<FailureGroup> {
  const messageMap = new Map<string, {
    occurrences: number;
    tests: Set<string>;
    products: Set<string>;
  }>()

  for (const tc of report.testCases) {
    for (const msg of tc.distinctFailureMessages) {
      let entry = messageMap.get(msg)
      if (!entry) {
        entry = { occurrences: 0, tests: new Set(), products: new Set() }
        messageMap.set(msg, entry)
      }
      entry.occurrences += tc.failCount
      entry.tests.add(tc.testCaseName)
      for (const prod of tc.products) {
        entry.products.add(prod)
      }
    }
  }

  let result: FailureGroup[] = [...messageMap.entries()].map(([message, entry]) => ({
    message,
    occurrences: entry.occurrences,
    affectedTests: [...entry.tests].sort(),
    affectedProducts: [...entry.products].sort(),
  }))

  if (filters?.search) {
    const needle = normalizeText(filters.search)
    result = result.filter((fg) => normalizeText(fg.message).includes(needle))
  }

  result.sort((a, b) => b.occurrences - a.occurrences)

  return paginate(result, filters?.pagination)
}
