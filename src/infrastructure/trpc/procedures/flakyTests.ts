import { publicProcedure, getVersionReport } from '../trpc.js';
import { flakyTestsInputSchema } from '../schemas/report.schemas.js';
import { queryFlakyTests } from '../../../application/utils/ReportQueries.js';

export const flakyTests = publicProcedure
  .input(flakyTestsInputSchema)
  .query(({ input, ctx }) => {
    const report = getVersionReport(ctx.reportStore, input.version);
    return queryFlakyTests(report, input);
  });
