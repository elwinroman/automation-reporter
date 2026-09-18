import fs from 'node:fs/promises'
import path from 'node:path'
import type { ReportSourceDiscovery } from '../../domain/ports/index.js'
import {
  MAX_REPORT_SOURCE_DISCOVERY_DEPTH,
  REPORT_SOURCE_NODE_KIND,
} from '../../domain/constants/index.js'
import type { ReportSourceNode } from '../../domain/value-objects/index.js'
import { hasDirectSourceMarker } from '../fs/SourceMarker.js'

/** Descubre directorios de fuentes de reportes desde una raiz configurada. */
export class FsReportSourceCatalog implements ReportSourceDiscovery {
  constructor(private readonly sourceRoot: string) {}

  async discover(): Promise<ReportSourceNode[]> {
    const rootPath = path.resolve(this.sourceRoot)
    return this.readDirectoryNodes(rootPath, 1)
  }

  private async readDirectoryNodes(
    directoryPath: string,
    depth: number,
  ): Promise<ReportSourceNode[]> {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true })
    const directories = entries
      .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
      .sort((left, right) => left.name.localeCompare(right.name))

    return Promise.all(
      directories.map((entry) => {
        const nodePath = path.join(directoryPath, entry.name)
        return this.createNode(nodePath, entry.name, depth)
      }),
    )
  }

  private async createNode(
    directoryPath: string,
    relativePath: string,
    depth: number,
  ): Promise<ReportSourceNode> {
    if (await hasDirectSourceMarker(directoryPath)) {
      return {
        path: relativePath,
        name: path.posix.basename(relativePath),
        kind: REPORT_SOURCE_NODE_KIND.SOURCE,
        children: [],
      }
    }

    const children =
      depth < MAX_REPORT_SOURCE_DISCOVERY_DEPTH
        ? await this.readChildNodes(directoryPath, relativePath, depth + 1)
        : []

    return {
      path: relativePath,
      name: path.posix.basename(relativePath),
      kind: REPORT_SOURCE_NODE_KIND.FOLDER,
      children,
    }
  }

  private async readChildNodes(
    directoryPath: string,
    relativePath: string,
    depth: number,
  ): Promise<ReportSourceNode[]> {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true })
    const directories = entries
      .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
      .sort((left, right) => left.name.localeCompare(right.name))

    return Promise.all(
      directories.map((entry) =>
        this.createNode(
          path.join(directoryPath, entry.name),
          path.posix.join(relativePath, entry.name),
          depth,
        ),
      ),
    )
  }
}
