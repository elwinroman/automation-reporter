import { publicProcedure, getVersionReport } from '../trpc.js'
import { testCasesInputSchema } from '../schemas/report.schemas.js'
import { queryTestCases } from '../../../application/utils/ReportQueries.js'

export const testCases = publicProcedure
  .input(testCasesInputSchema)
  .query(({ input, ctx }) => {
    const report = getVersionReport(ctx.reportStore, input.version)
    return queryTestCases(report, input)
  })
