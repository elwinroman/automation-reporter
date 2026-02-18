import fs from 'node:fs/promises';
import path from 'node:path';
import type { XmlFileLocator } from '../../domain/ports/index.js';

/** Implementacion de {@link XmlFileLocator} que recorre el filesystem con Node.js `fs/promises`. */
export class FsXmlFileLocator implements XmlFileLocator {
  async findSummaryFiles(directory: string): Promise<string[]> {
    const absoluteDir = path.resolve(directory);
    const results: string[] = [];
    await this.walkDir(absoluteDir, results);
    return results.sort();
  }

  private async walkDir(dir: string, results: string[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.walkDir(fullPath, results);
      } else if (entry.name === 'summary.xml') {
        results.push(fullPath);
      }
    }
  }
}
