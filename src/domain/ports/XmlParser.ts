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
  /** Parsea el contenido XML de un summary.xml y retorna las suites con sus test cases. */
  parse(xmlContent: string): ParsedTestSuites;
}
