import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './router.js';
import { createContextFactory } from './context.js';
import { ReportStore } from './reportStore.js';
import type { GenerateReportDeps } from '../../application/use-cases/index.js';

/** Opciones para iniciar el servidor tRPC standalone. */
export interface ServerOptions {
  port: number;
  host: string;
  generateReportDeps: GenerateReportDeps;
}

/**
 * Inicia el servidor HTTP standalone con tRPC.
 * Configura CORS via `responseMeta` y crea una instancia de {@link ReportStore}.
 */
export function startServer(options: ServerOptions): void {
  const reportStore = new ReportStore();

  const createContext = createContextFactory(reportStore, options.generateReportDeps);

  const server = createHTTPServer({
    router: appRouter,
    createContext,
    responseMeta({ paths }) {
      const headers: Record<string, string> = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (paths?.some((p) => p === 'report.versions')) {
        headers['Cache-Control'] = 'no-store';
      }

      return { headers };
    },
  });

  server.listen(options.port, options.host);

  console.log(`tRPC server listening on http://${options.host}:${options.port}`);
}
