import { initTRPC, TRPCError } from '@trpc/server'
import type { TrpcContext } from './context.js'
import type { ReportStore } from './reportStore.js'
import type { AggregatedReport } from '../../domain/entities/index.js'

const t = initTRPC.context<TrpcContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

/**
 * Obtiene el reporte cacheado para una version.
 * Lanza PRECONDITION_FAILED si la version no ha sido generada.
 */
export function getVersionReport(reportStore: ReportStore, version: string): AggregatedReport {
  if (!reportStore.hasReport(version)) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: `No report for version "${version}". Call report.generate first.`,
    })
  }
  return reportStore.getReport(version)
}
