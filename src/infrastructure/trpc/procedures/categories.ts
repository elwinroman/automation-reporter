import { publicProcedure, getVersionReport } from '../trpc.js'
import { categoriesInputSchema } from '../schemas/report.schemas.js'
import { queryCategories } from '../../../application/utils/ReportQueries.js'

export const categories = publicProcedure
  .input(categoriesInputSchema)
  .query(({ input, ctx }) => {
    const report = getVersionReport(ctx.reportStore, input.version)
    return queryCategories(report, input)
  })
