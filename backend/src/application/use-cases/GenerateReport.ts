import fs from 'node:fs/promises'
import type { XmlFileLocator, XmlParser, ReportExporter } from '../../domain/ports/index.js'
import type { TestExecution, AggregatedReport } from '../../domain/entities/index.js'
import { SUPPORTED_REPORT_ARTIFACT_FILENAMES } from '../../domain/constants/index.js'
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
 * Flujo: localiza fuentes de reporte -> parsea cada una -> extrae metadata de carpeta -> ensambla reporte -> exporta.
 *
 * @throws Error si no se encuentran fuentes de reporte soportadas en el directorio.
 */
export async function generateReport(
  sourceDirectory: string,
  outputPath: string,
  deps: GenerateReportDeps,
  logsDirectory?: string,
): Promise<AggregatedReport> {
  const files = await deps.xmlFileLocator.findSummaryFiles(sourceDirectory)

  if (files.length === 0) {
    throw new Error(`No se encontraron archivos ${SUPPORTED_REPORT_ARTIFACT_FILENAMES[0]} ni ${SUPPORTED_REPORT_ARTIFACT_FILENAMES[1]} en: ${sourceDirectory}`)
  }

  console.log(`Encontradas ${files.length} fuentes de reporte`)

  const executions: TestExecution[] = []

  for (const filePath of files) {
    const xmlContent = await fs.readFile(filePath, 'utf-8')
    const parsed = await deps.xmlParser.parse(xmlContent, filePath)
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
