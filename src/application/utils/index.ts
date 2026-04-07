export { extractFolderMetadata } from './FolderMetadataExtractor.js'
export { aggregateTestCases } from './TestCaseAggregator.js'
export { assembleReport } from './ReportAssembler.js'
export {
  queryGlobalSummary,
  queryCategories,
  queryProducts,
  queryTestCases,
  queryExecutions,
  queryProductDetail,
  queryFlakyTests,
  querySlowestTests,
  queryFailureAnalysis,
  type PaginatedResult,
  type FailureGroup,
  type ProductDetailResult,
} from './ReportQueries.js'
