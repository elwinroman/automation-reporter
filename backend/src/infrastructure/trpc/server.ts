import { createServer } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHTTPHandler } from '@trpc/server/adapters/standalone'
import { appRouter } from './router.js'
import { createContextFactory } from './context.js'
import { ReportStore } from './reportStore.js'
import { env } from '../../core/environment.js'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { GenerateReportDeps } from '../../application/use-cases/index.js'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function serveFile(
  req: IncomingMessage,
  res: ServerResponse,
  allowedOrigins: Set<string> | null,
): Promise<boolean> {
  const url = req.url ?? ''
  if (!url.startsWith('/files/')) return false

  const relative = decodeURIComponent(url.slice(7)) // strip '/files/'
  const logsDir  = path.resolve(env.LOGS_DIRECTORY)
  const absolute = path.resolve(path.join(logsDir, relative))

  // Security: must stay within LOGS_DIRECTORY
  if (!absolute.startsWith(logsDir + path.sep) && absolute !== logsDir) {
    res.writeHead(403)
    res.end('Forbidden')
    return true
  }

  try {
    const content = await fs.readFile(absolute)
    const ext = path.extname(absolute).toLowerCase()
    applyCorsHeaders(req, res, allowedOrigins)
    res.writeHead(200, {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Content-Disposition': 'inline',
    })
    res.end(content)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
  return true
}

/** Opciones para iniciar el servidor tRPC standalone. */
export interface ServerOptions {
  port: number;
  host: string;
  generateReportDeps: GenerateReportDeps;
}

/**
 * Parsea `ALLOWED_URLS` en un Set de orígenes permitidos.
 * Retorna `null` si la variable no está configurada (→ wildcard `*`).
 */
function parseAllowedOrigins(): Set<string> | null {
  if (!env.ALLOWED_URLS) return null
  const origins = env.ALLOWED_URLS.split(',').map((u) => u.trim()).filter(Boolean)
  return origins.length > 0 ? new Set(origins) : null
}

/**
 * Aplica los headers CORS a la respuesta según el origen del request.
 * Retorna `true` si el origen está permitido (o si no hay restricción), `false` si fue bloqueado.
 */
function applyCorsHeaders(
  req: IncomingMessage,
  res: ServerResponse,
  allowedOrigins: Set<string> | null,
): boolean {
  const requestOrigin = req.headers.origin

  if (allowedOrigins === null) {
    res.setHeader('Access-Control-Allow-Origin', '*')
  } else if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin)
    res.setHeader('Vary', 'Origin')
  } else {
    // Origen no permitido — navegador bloqueará la respuesta
    return false
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  return true
}

/**
 * Inicia el servidor HTTP standalone con tRPC.
 *
 * Los preflights OPTIONS se responden directamente (204) con los headers CORS
 * correctos antes de que tRPC los procese, evitando el error de CORS en el
 * navegador.
 *
 * - Si `ALLOWED_URLS` no está definido → `Access-Control-Allow-Origin: *`
 * - Si `ALLOWED_URLS` está definido → solo los orígenes de la lista son
 *   aceptados; el resto es bloqueado por el navegador.
 */
export function startServer(options: ServerOptions): void {
  const allowedOrigins = parseAllowedOrigins()
  const reportStore = new ReportStore()
  const createContext = createContextFactory(reportStore, options.generateReportDeps)

  const trpcHandler = createHTTPHandler({
    router: appRouter,
    createContext,
    responseMeta({ paths }) {
      const headers: Record<string, string> = {}
      if (paths?.some((p) => p === 'report.versions')) {
        headers['Cache-Control'] = 'no-store'
      }
      return { headers }
    },
  })

  const server = createServer((req, res) => {
    applyCorsHeaders(req, res, allowedOrigins)

    // Responder preflights aquí — tRPC no los maneja y devolvería un status no-2xx
    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    trpcHandler(req, res)
  })

  server.listen(options.port, options.host)

  if (allowedOrigins) {
    console.log(`CORS allowed origins: ${[...allowedOrigins].join(', ')}`)
  } else {
    console.log('CORS: all origins allowed (*)')
  }
  console.log(`tRPC server listening on http://${options.host}:${options.port}`)
}
