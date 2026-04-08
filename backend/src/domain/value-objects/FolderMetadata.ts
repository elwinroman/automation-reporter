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
  /**
   * Todos los segmentos del path extraidos de `info.name`.
   * Ej: "AutomationCorebank: Creditos\Reprogramacion\Rural"
   *   → ["Creditos", "Reprogramacion", "Rural"]
   * Para el fallback por nombre de carpeta: ["Categoria", "Producto"].
   */
  tags: string[];
}
