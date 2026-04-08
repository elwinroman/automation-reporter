/** Puerto para localizar archivos summary.xml en el filesystem. */
export interface XmlFileLocator {
  /** Busca recursivamente archivos `summary.xml` dentro del directorio dado. */
  findSummaryFiles(directory: string): Promise<string[]>;
}
