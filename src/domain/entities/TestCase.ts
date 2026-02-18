import type { TestStatus } from '../value-objects/index.js';

/** Test case individual parseado de un archivo JUnit XML. */
export interface TestCase {
  name: string;
  classname: string;
  /** Duracion en segundos. */
  time: number;
  status: TestStatus;
  /** Mensajes extraidos de los elementos `<failure>` del XML. */
  failureMessages: string[];
}
