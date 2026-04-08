import { Command } from 'commander'
import { generateReport } from '../../../application/use-cases/index.js'
import { FsXmlFileLocator } from '../../adapters/FsXmlFileLocator.js'
import { FastXmlParserAdapter } from '../../adapters/FastXmlParser.js'
import { JsonReportExporter } from '../../adapters/JsonReportExporter.js'
import { env } from '../../../core/environment.js'

export const generateCommand = new Command('generate')
  .description('Genera un reporte JSON agregado a partir de archivos summary.xml o logs HTML legacy (_root.js)')
  .argument('[directory]', 'Directorio raiz con los logs (default: LOGS_DIRECTORY del .env)')
  .option('-o, --output <path>', 'Ruta del archivo JSON de salida', './output/report.json')
  .action(async(directory: string | undefined, options: { output: string }) => {
    const logsDir = directory ?? env.LOGS_DIRECTORY

    try {
      const deps = {
        xmlFileLocator: new FsXmlFileLocator(),
        xmlParser: new FastXmlParserAdapter(),
        reportExporter: new JsonReportExporter(),
      }

      const report = await generateReport(logsDir, options.output, deps)

      console.log('\nResumen:')
      console.log(`  Ejecuciones E2E: ${report.globalSummary.totalExecutions}`)
      console.log(`  Test cases unicos: ${report.globalSummary.uniqueTestCases}`)
      console.log(`  Test cases totales: ${report.globalSummary.totalTestCases}`)
      console.log(`  Pasados: ${report.globalSummary.totalPassed}`)
      console.log(`  Fallidos: ${report.globalSummary.totalFailed}`)
      console.log(`  Tasa de éxito: ${report.globalSummary.globalPassRate}%`)
      console.log(`  Tiempo total: ${report.globalSummary.totalTime}s`)
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`)
      process.exit(1)
    }
  })
