import fs from 'node:fs/promises';
import path from 'node:path';
import type { FolderMetadata } from '../../domain/value-objects/index.js';

/** Patron conocido de carpeta: `Categoria_Producto_YYYYMMDD_HHMMSS` */
const KNOWN_PATTERN = /^([A-Za-z]+)_([A-Za-z]+)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/;

/** Extrae el JSON del wrapper JSONP `_json_loaded("_root.js", {...})` */
const JSONP_REGEX = /_json_loaded\(\s*"[^"]*"\s*,\s*([\s\S]+)\s*\)\s*$/;

/**
 * Extrae metadata de una ejecucion de tests.
 *
 * Estrategia:
 * 1. Busca `_root.js` junto al summary.xml y extrae `info.name` (ruta del proyecto)
 *    y `info.startTime` (timestamp ms). Esto da category, product y fecha exacta.
 * 2. Si no existe `_root.js`, intenta parsear el nombre de carpeta con el patron conocido.
 * 3. Fallback: category/product = 'Unknown', fecha = now.
 */
export async function extractFolderMetadata(filePath: string): Promise<FolderMetadata> {
  const dir = path.dirname(filePath);
  const folderName = path.basename(dir);

  const rootJsMetadata = await tryParseRootJs(dir);
  if (rootJsMetadata) {
    return { ...rootJsMetadata, rawFolderName: folderName };
  }

  return extractFromFolderName(dir, folderName);
}

/**
 * Intenta leer y parsear `_root.js` del directorio dado.
 * El archivo es JSONP: `_json_loaded("_root.js", { ... })`.
 * Extrae `info.name` (ej: "AutomationCorebank: Creditos\\Otorgamiento\\RuralFacilito")
 * y `info.startTime` (Unix ms).
 */
async function tryParseRootJs(dir: string): Promise<Omit<FolderMetadata, 'rawFolderName'> | null> {
  const rootJsPath = path.join(dir, '_root.js');

  let content: string;
  try {
    content = await fs.readFile(rootJsPath, 'utf-8');
  } catch {
    return null;
  }

  const jsonpMatch = content.match(JSONP_REGEX);
  if (!jsonpMatch) return null;

  let data: RootJsData;
  try {
    data = JSON.parse(jsonpMatch[1]);
  } catch {
    return null;
  }

  const infoName = data?.info?.name;
  if (!infoName) return null;

  const { category, product } = parseInfoName(infoName);
  const executionDate = data.info.startTime
    ? new Date(parseInt(data.info.startTime))
    : new Date();

  return { category, product, executionDate };
}

/**
 * Parsea `info.name` que sigue el patron:
 * `"AutomationCorebank: Categoria\Subcategoria\Producto"` o
 * `"AutomationCorebank: Categoria\Producto"`
 *
 * Primer segmento = category, ultimo segmento = product.
 */
function parseInfoName(infoName: string): { category: string; product: string } {
  const colonIndex = infoName.indexOf(': ');
  const pathPart = colonIndex >= 0 ? infoName.slice(colonIndex + 2) : infoName;

  const segments = pathPart.split(/[\\\/]/).filter(Boolean);

  return {
    category: segments[0] ?? 'Unknown',
    product: segments[segments.length - 1] ?? 'Unknown',
  };
}

/** Fallback: intenta extraer metadata del nombre de carpeta. */
function extractFromFolderName(dir: string, folderName: string): FolderMetadata {
  const parts = dir.split(path.sep);

  for (let i = parts.length - 1; i >= 0; i--) {
    const match = parts[i].match(KNOWN_PATTERN);
    if (match) {
      const [, category, product, year, month, day, hour, minute, second] = match;
      return {
        category,
        product,
        executionDate: new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second),
        ),
        rawFolderName: parts[i],
      };
    }
  }

  return {
    category: 'Unknown',
    product: 'Unknown',
    executionDate: new Date(),
    rawFolderName: folderName,
  };
}

/** Estructura relevante del JSON dentro de `_root.js`. */
interface RootJsData {
  name?: string;
  info: {
    name?: string;
    startTime?: string;
    endTime?: string;
  };
}
