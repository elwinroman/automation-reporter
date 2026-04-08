import fs from 'node:fs/promises'
import { publicProcedure } from '../trpc.js'
import { env } from '../../../core/environment.js'

export const versions = publicProcedure.query(async({ ctx }) => {
  const entries = await fs.readdir(env.LOGS_DIRECTORY, { withFileTypes: true })
  const dirs = entries.filter((e) => e.isDirectory())

  return dirs.map((d) => ({
    name: d.name,
    cached: ctx.reportStore.hasReport(d.name),
    generatedAt: ctx.reportStore.getGeneratedAt(d.name)?.toISOString() ?? null,
  }))
})
