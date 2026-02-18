/**
 * Metadatos de una ejecucion de tests.
 * Fuente primaria: archivo `_root.js` junto al summary.xml (`info.name`, `startTime`).
 * Fallback: patron del nombre de carpeta `{Categoria}_{Producto}_{YYYYMMDD}_{HHMMSS}`.
 * Si ninguno aplica, category/product quedan como 'Unknown'.
 */
export interface FolderMetadata {
  category: string;
  product: string;
  executionDate: Date;
  /** Nombre original de la carpeta que contiene el summary.xml. */
  rawFolderName: string;
}
