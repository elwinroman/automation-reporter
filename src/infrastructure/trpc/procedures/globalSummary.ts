import { publicProcedure, getVersionReport } from '../trpc.js';
import { globalSummaryInputSchema } from '../schemas/report.schemas.js';
import { queryGlobalSummary } from '../../../application/utils/ReportQueries.js';

export const globalSummary = publicProcedure
  .input(globalSummaryInputSchema)
  .query(({ input, ctx }) => {
    const report = getVersionReport(ctx.reportStore, input.version);
    return queryGlobalSummary(report, input);
  });
