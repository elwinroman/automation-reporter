import fs from 'node:fs/promises'
import path from 'node:path'
import type { XmlFileLocator } from '../../domain/ports/index.js'

/** Implementacion de {@link XmlFileLocator} que localiza reportes JUnit o logs HTML legacy. */
export class FsXmlFileLocator implements XmlFileLocator {
  async findSummaryFiles(directory: string): Promise<string[]> {
    const absoluteDir = path.resolve(directory)
    const results: string[] = []
    await this.walkDir(absoluteDir, results)
    return results.sort()
  }

  private async walkDir(dir: string, results: string[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const entryNames = new Set(entries.map((entry) => entry.name))

    if (entryNames.has('summary.xml')) {
      results.push(path.join(dir, 'summary.xml'))
    } else if (entryNames.has('_root.js')) {
      results.push(path.join(dir, '_root.js'))
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await this.walkDir(fullPath, results)
      }
    }
  }
}
