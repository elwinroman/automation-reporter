/** Tipos de nodo del arbol de fuentes de reportes. */
export const REPORT_SOURCE_NODE_KIND = {
  FOLDER: 'folder',
  SOURCE: 'source',
} as const

export type ReportSourceNodeKind =
  (typeof REPORT_SOURCE_NODE_KIND)[keyof typeof REPORT_SOURCE_NODE_KIND]

/**
 * Nombre del marcador que identifica una fuente de reportes seleccionable.
 * La carpeta marcada agrupa todo su contenido en un unico reporte.
 */
export const REPORT_SOURCE_MARKER = '.automation-reporter-marker'

/** Profundidad maxima de recorrido del arbol de fuentes y ejecuciones. */
export const MAX_REPORT_SOURCE_DISCOVERY_DEPTH = 10
