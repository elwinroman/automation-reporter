import fs from 'node:fs/promises'
import path from 'node:path'
import type { XmlFileLocator } from '../../domain/ports/index.js'
import {
  MAX_REPORT_SOURCE_DISCOVERY_DEPTH,
  SUPPORTED_REPORT_ARTIFACT_FILENAMES,
} from '../../domain/constants/index.js'

/** Implementacion de {@link XmlFileLocator} que localiza reportes JUnit o logs HTML legacy. */
export class FsXmlFileLocator implements XmlFileLocator {
  async findSummaryFiles(directory: string): Promise<string[]> {
    const absoluteDir = path.resolve(directory)
    const results: string[] = []
    await this.walkDir(absoluteDir, results, 0)
    return results.sort()
  }

  private async walkDir(dir: string, results: string[], depth: number): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const summaryFile = entries.find(
      (entry) =>
        entry.name === SUPPORTED_REPORT_ARTIFACT_FILENAMES[0] &&
        entry.isFile() &&
        !entry.isSymbolicLink(),
    )
    const rootFile = entries.find(
      (entry) =>
        entry.name === SUPPORTED_REPORT_ARTIFACT_FILENAMES[1] &&
        entry.isFile() &&
        !entry.isSymbolicLink(),
    )

    if (summaryFile) {
      results.push(path.join(dir, SUPPORTED_REPORT_ARTIFACT_FILENAMES[0]))
      return
    }

    if (rootFile) {
      results.push(path.join(dir, SUPPORTED_REPORT_ARTIFACT_FILENAMES[1]))
      return
    }

    if (depth >= MAX_REPORT_SOURCE_DISCOVERY_DEPTH) return

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        await this.walkDir(fullPath, results, depth + 1)
      }
    }
  }
}
