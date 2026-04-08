import { publicProcedure, getVersionReport } from '../trpc.js'
import { slowestProductsInputSchema } from '../schemas/report.schemas.js'
import { querySlowestProducts } from '../../../application/utils/ReportQueries.js'

export const slowestProducts = publicProcedure
  .input(slowestProductsInputSchema)
  .query(({ input, ctx }) => {
    const report = getVersionReport(ctx.reportStore, input.version)
    return querySlowestProducts(report, input)
  })
