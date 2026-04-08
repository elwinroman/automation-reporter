import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const currentDir = dirname(fileURLToPath(import.meta.url))
const backendRoot = resolve(currentDir, '../..')
const workspaceRoot = resolve(backendRoot, '..')

for (const envPath of [resolve(backendRoot, '.env'), resolve(workspaceRoot, '.env')]) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
}

const envSchema = z.object({
  LOGS_DIRECTORY: z.string().min(1, 'LOGS_DIRECTORY is required'),
  /** Comma-separated list of allowed CORS origins. If omitted, all origins are allowed (`*`). */
  ALLOWED_URLS: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

/** Variables de entorno validadas con Zod. */
export const env = parsed.data
