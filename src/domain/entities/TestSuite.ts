import type { TestCase } from './TestCase.js';

/** Suite de tests correspondiente a un elemento `<testsuite>` del JUnit XML. */
export interface TestSuite {
  name: string;
  tests: number;
  failures: number;
  errors: number;
  /** Duracion en segundos. */
  time: number;
  hostname: string;
  /** Timestamp ISO del XML original. */
  timestamp: string;
  testCases: TestCase[];
}
