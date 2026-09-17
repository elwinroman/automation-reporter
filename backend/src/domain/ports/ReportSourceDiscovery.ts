import type { ReportSourceNode } from '../value-objects/index.js'

/** Puerto para descubrir el arbol anidado de fuentes de reporte disponibles. */
export interface ReportSourceDiscovery {
  /** Descubre las fuentes de reporte organizadas como un arbol de dominio. */
  discover(): Promise<ReportSourceNode[]>;
}
