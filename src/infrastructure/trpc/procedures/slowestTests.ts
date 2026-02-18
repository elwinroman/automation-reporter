import { publicProcedure, getVersionReport } from '../trpc.js';
import { slowestTestsInputSchema } from '../schemas/report.schemas.js';
import { querySlowestTests } from '../../../application/utils/ReportQueries.js';

export const slowestTests = publicProcedure
  .input(slowestTestsInputSchema)
  .query(({ input, ctx }) => {
    const report = getVersionReport(ctx.reportStore, input.version);
    return querySlowestTests(report, input);
  });
