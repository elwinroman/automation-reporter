import { Command } from 'commander'
import { FsXmlFileLocator } from '../../adapters/FsXmlFileLocator.js'
import { FastXmlParserAdapter } from '../../adapters/FastXmlParser.js'
import { startServer } from '../../trpc/server.js'

export const serveCommand = new Command('serve')
  .description('Inicia el servidor tRPC para servir datos del reporte via HTTP')
  .option('-p, --port <number>', 'Puerto del servidor', '3000')
  .option('-H, --host <address>', 'Direccion del host', 'localhost')
  .action((options: { port: string; host: string }) => {
    const port = parseInt(options.port, 10)

    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('Error: Puerto invalido')
      process.exit(1)
    }

    const generateReportDeps = {
      xmlFileLocator: new FsXmlFileLocator(),
      xmlParser: new FastXmlParserAdapter(),
      reportExporter: { export: async() => {} },
    }

    startServer({
      port,
      host: options.host,
      generateReportDeps,
    })
  })
