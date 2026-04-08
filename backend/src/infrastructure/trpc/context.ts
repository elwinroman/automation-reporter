import type { IncomingMessage } from 'node:http'
import type { ReportStore } from './reportStore.js'
import type { GenerateReportDeps } from '../../application/use-cases/index.js'

/** Contexto disponible en todos los procedimientos tRPC. */
export interface TrpcContext {
  reportStore: ReportStore;
  generateReportDeps: GenerateReportDeps;
  /** Origin header del request entrante (usado para validación CORS). */
  origin: string | undefined;
}

/**
 * Crea una factory de contexto tRPC con las dependencias capturadas por closure.
 * Se invoca una vez al iniciar el servidor.
 */
export function createContextFactory(
  reportStore: ReportStore,
  generateReportDeps: GenerateReportDeps,
) {
  return function createContext({ req }: { req: IncomingMessage }): TrpcContext {
    return {
      reportStore,
      generateReportDeps,
      origin: req.headers.origin,
    }
  }
}
