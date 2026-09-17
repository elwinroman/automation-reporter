import fs from 'node:fs/promises'
import path from 'node:path'
import { REPORT_SOURCE_MARKER } from '../../domain/constants/index.js'

/**
 * Indica si el directorio contiene el marcador de fuente de reportes.
 * El marcador debe ser un archivo regular y no un enlace simbolico.
 */
export async function hasDirectSourceMarker(directory: string): Promise<boolean> {
  try {
    const marker = await fs.lstat(path.join(directory, REPORT_SOURCE_MARKER))
    return marker.isFile() && !marker.isSymbolicLink()
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return false
    }

    throw new Error('Report source marker is unavailable')
  }
}
