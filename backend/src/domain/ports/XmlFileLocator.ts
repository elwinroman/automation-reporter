/** Puerto para localizar archivos fuente de reporte en el filesystem. */
export interface XmlFileLocator {
  /** Busca recursivamente archivos de entrada soportados (`summary.xml` o `_root.js`). */
  findSummaryFiles(directory: string): Promise<string[]>;
}
