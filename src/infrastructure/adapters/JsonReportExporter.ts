import fs from 'node:fs/promises'
import path from 'node:path'
import type { ReportExporter } from '../../domain/ports/index.js'
import type { AggregatedReport } from '../../domain/entities/index.js'

/** Implementacion de {@link ReportExporter} que escribe el reporte como JSON formateado a disco. */
export class JsonReportExporter implements ReportExporter {
  async export(report: AggregatedReport, outputPath: string): Promise<void> {
    const absolutePath = path.resolve(outputPath)
    const dir = path.dirname(absolutePath)

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(absolutePath, JSON.stringify(report, null, 2), 'utf-8')
  }
}
