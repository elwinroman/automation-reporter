import { TRPCError } from '@trpc/server'
import { publicProcedure } from '../trpc.js'
import { generateInputSchema } from '../schemas/report.schemas.js'
import { generateReport } from '../../../application/use-cases/index.js'
import { env } from '../../../core/environment.js'
import { resolveReportSourceDirectory } from '../resolveReportSourceDirectory.js'

export const generate = publicProcedure
  .input(generateInputSchema)
  .mutation(async({ input, ctx }) => {
    let sourceDirectory: string

    try {
      sourceDirectory = await resolveReportSourceDirectory(input.version)
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error instanceof Error ? error.message : 'Invalid report source ID',
      })
    }

    const deps = {
      ...ctx.generateReportDeps,
      reportExporter: { export: async() => {} },
    }

    const report = await generateReport(sourceDirectory, '', deps, env.LOGS_DIRECTORY)
    report.reportMetadata.sourceDirectory = input.version

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
