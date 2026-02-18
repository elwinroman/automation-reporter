import { publicProcedure, getVersionReport } from '../trpc.js';
import { executionsInputSchema } from '../schemas/report.schemas.js';
import { queryExecutions } from '../../../application/utils/ReportQueries.js';

export const executions = publicProcedure
  .input(executionsInputSchema)
  .query(({ input, ctx }) => {
    const report = getVersionReport(ctx.reportStore, input.version);
    return queryExecutions(report, input);
  });
