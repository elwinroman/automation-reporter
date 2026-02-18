import { TRPCError } from '@trpc/server';
import { publicProcedure, getVersionReport } from '../trpc.js';
import { productDetailInputSchema } from '../schemas/report.schemas.js';
import { queryProductDetail } from '../../../application/utils/ReportQueries.js';

export const productDetail = publicProcedure
  .input(productDetailInputSchema)
  .query(({ input, ctx }) => {
    const report = getVersionReport(ctx.reportStore, input.version);
    const result = queryProductDetail(report, input.product);

    if (!result) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Product "${input.product}" not found in the report.`,
      });
    }

    return result;
  });
