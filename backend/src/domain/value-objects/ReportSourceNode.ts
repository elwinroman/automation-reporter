import type { ReportSourceNodeKind } from '../constants/index.js'

/**
 * Nodo del arbol de fuentes disponible para un reporte.
 * `path` es un identificador POSIX canonico relativo a la raiz de fuentes.
 */
export interface ReportSourceNode {
  path: string;
  name: string;
  kind: ReportSourceNodeKind;
  children: ReportSourceNode[];
}
