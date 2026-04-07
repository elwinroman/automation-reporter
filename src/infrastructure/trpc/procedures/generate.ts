import path from 'node:path'
import { TRPCError } from '@trpc/server'
import { publicProcedure } from '../trpc.js'
import { generateInputSchema } from '../schemas/report.schemas.js'
import { generateReport } from '../../../application/use-cases/index.js'
import { env } from '../../../core/environment.js'

export const generate = publicProcedure
  .input(generateInputSchema)
  .mutation(async({ input, ctx }) => {
    if (input.version.includes('..') || input.version.includes('/') || input.version.includes('\\')) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid version name. Must not contain path separators or "..".',
      })
    }

    const sourceDirectory = path.join(env.LOGS_DIRECTORY, input.version)

    const deps = {
      ...ctx.generateReportDeps,
      reportExporter: { export: async() => {} },
    }

    const report = await generateReport(sourceDirectory, '', deps, env.LOGS_DIRECTORY)

    ctx.reportStore.setReport(input.version, report)

    return {
      version: input.version,
      success: true,
      generatedAt: new Date().toISOString(),
      summary: {
        totalFilesProcessed: report.reportMetadata.totalFilesProcessed,
        totalExecutions: report.globalSummary.totalExecutions,
        totalTestCases: report.globalSummary.totalTestCases,
        globalPassRate: report.globalSummary.globalPassRate,
      },
    }
  })
