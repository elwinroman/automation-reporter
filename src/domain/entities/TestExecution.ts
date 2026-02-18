import type { FolderMetadata } from '../value-objects/index.js';
import type { TestSuite } from './TestSuite.js';

/** Representa el resultado de parsear un archivo summary.xml individual. */
export interface TestExecution {
  /** Ruta absoluta al archivo summary.xml. */
  filePath: string;
  /** Categoria, producto y fecha extraidos del nombre de la carpeta. */
  metadata: FolderMetadata;
  suites: TestSuite[];
  totalTests: number;
  totalFailures: number;
  totalErrors: number;
  totalTime: number;
}
