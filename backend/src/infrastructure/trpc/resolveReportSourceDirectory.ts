import fs from 'node:fs/promises'
import path from 'node:path'
import { env } from '../../core/environment.js'
import { hasDirectSourceMarker } from '../fs/SourceMarker.js'

const WINDOWS_DRIVE_PATH = /^[A-Za-z]:/

export async function resolveReportSourceDirectory(sourceId: string): Promise<string> {
  const segments = parseCanonicalSourceId(sourceId)
  const rootDirectory = await resolveLogsDirectory()
  const selectedDirectory = await resolveSelectedDirectory(rootDirectory, segments)

  if (!isWithinRoot(rootDirectory, selectedDirectory)) {
    throw new Error('Report source directory is outside the configured logs directory')
  }

  if (!(await hasDirectSourceMarker(selectedDirectory))) {
    throw new Error('Report source directory is not marked as selectable')
  }

  return selectedDirectory
}

function parseCanonicalSourceId(sourceId: string): string[] {
  if (
    sourceId.length === 0 ||
    sourceId.includes('\\') ||
    sourceId.startsWith('/') ||
    WINDOWS_DRIVE_PATH.test(sourceId) ||
    path.win32.isAbsolute(sourceId)
  ) {
    throw new Error('Invalid report source ID')
  }

  const segments = sourceId.split('/')

  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    throw new Error('Invalid report source ID')
  }

  return segments
}

async function resolveLogsDirectory(): Promise<string> {
  const rootDirectory = await fs.realpath(env.LOGS_DIRECTORY).catch(() => null)

  if (!rootDirectory) {
    throw new Error('Configured logs directory is unavailable')
  }

  const stats = await fs.stat(rootDirectory).catch(() => null)

  if (!stats || !stats.isDirectory()) {
    throw new Error('Configured logs directory is not a directory')
  }

  return rootDirectory
}

async function resolveSelectedDirectory(rootDirectory: string, segments: string[]): Promise<string> {
  const selectedDirectory = await fs
    .realpath(path.resolve(rootDirectory, ...segments))
    .catch(() => null)

  if (!selectedDirectory) {
    throw new Error('Report source directory is unavailable')
  }

  const stats = await fs.stat(selectedDirectory).catch(() => null)

  if (!stats || !stats.isDirectory()) {
    throw new Error('Report source is not a directory')
  }

  return selectedDirectory
}

function isWithinRoot(rootDirectory: string, selectedDirectory: string): boolean {
  const relativePath = path.relative(rootDirectory, selectedDirectory)
  return relativePath === '' ||
    (!relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath))
}
