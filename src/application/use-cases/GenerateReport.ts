import fs from 'node:fs/promises'
import type { XmlFileLocator, XmlParser, ReportExporter } from '../../domain/ports/index.js'
import type { TestExecution, AggregatedReport } from '../../domain/entities/index.js'
import { extractFolderMetadata } from '../utils/FolderMetadataExtractor.js'
import { assembleReport } from '../utils/ReportAssembler.js'

/** Dependencias inyectables para el caso de uso de generacion de reporte. */
export interface GenerateReportDeps {
  xmlFileLocator: XmlFileLocator;
  xmlParser: XmlParser;
  reportExporter: ReportExporter;
}

/**
 * Caso de uso principal: genera un reporte agregado.
 *
 * Flujo: localiza XMLs -> parsea cada uno -> extrae metadata de carpeta -> ensambla reporte -> exporta.
 *
 * @throws Error si no se encuentran archivos summary.xml en el directorio.
 */
export async function generateReport(
  sourceDirectory: string,
  outputPath: string,
  deps: GenerateReportDeps,
  logsDirectory?: string,
): Promise<AggregatedReport> {
  const files = await deps.xmlFileLocator.findSummaryFiles(sourceDirectory)

  if (files.length === 0) {
    throw new Error(`No se encontraron archivos summary.xml en: ${sourceDirectory}`)
  }

  console.log(`Encontrados ${files.length} archivos summary.xml`)

  const executions: TestExecution[] = []

  for (const filePath of files) {
    const xmlContent = await fs.readFile(filePath, 'utf-8')
    const parsed = deps.xmlParser.parse(xmlContent)
    const metadata = await extractFolderMetadata(filePath)

    executions.push({
      filePath,
      metadata,
      suites: parsed.suites,
      totalTests: parsed.tests,
      totalFailures: parsed.failures,
      totalErrors: parsed.errors,
      totalTime: parsed.time,
    })
  }

  const report = assembleReport(executions, sourceDirectory, logsDirectory)

  await deps.reportExporter.export(report, outputPath)

  console.log(`Reporte generado en: ${outputPath}`)

  return report
}
