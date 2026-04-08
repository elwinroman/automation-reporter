import type { TestSuite } from '../entities/index.js'

/** Resultado del parseo de un archivo JUnit XML completo (elemento raiz `<testsuites>`). */
export interface ParsedTestSuites {
  name: string;
  tests: number;
  failures: number;
  errors: number;
  time: number;
  suites: TestSuite[];
}

/** Puerto para parsear contenido XML JUnit a objetos de dominio. */
export interface XmlParser {
  /** Parsea el contenido de una fuente de reporte y retorna las suites con sus test cases. */
  parse(content: string, sourcePath: string): Promise<ParsedTestSuites>;
}
