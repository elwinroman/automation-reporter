import { publicProcedure, getVersionReport } from '../trpc.js';
import { productsInputSchema } from '../schemas/report.schemas.js';
import { queryProducts } from '../../../application/utils/ReportQueries.js';

export const products = publicProcedure
  .input(productsInputSchema)
  .query(({ input, ctx }) => {
    const report = getVersionReport(ctx.reportStore, input.version);
    return queryProducts(report, input);
  });
