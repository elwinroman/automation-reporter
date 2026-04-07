import { publicProcedure, getVersionReport } from '../trpc.js'
import { failureAnalysisInputSchema } from '../schemas/report.schemas.js'
import { queryFailureAnalysis } from '../../../application/utils/ReportQueries.js'

export type { FailureGroup } from '../../../application/utils/ReportQueries.js'

export const failureAnalysis = publicProcedure
  .input(failureAnalysisInputSchema)
  .query(({ input, ctx }) => {
    const report = getVersionReport(ctx.reportStore, input.version)
    return queryFailureAnalysis(report, input)
  })
