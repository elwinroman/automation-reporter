import type { AggregatedReport } from '../entities/index.js';

/** Puerto para exportar un reporte agregado a un destino persistente. */
export interface ReportExporter {
  /** Persiste el reporte en la ruta indicada. */
  export(report: AggregatedReport, outputPath: string): Promise<void>;
}
