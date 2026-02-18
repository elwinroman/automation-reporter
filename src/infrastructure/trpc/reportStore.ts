import type { AggregatedReport } from '../../domain/entities/index.js';

interface CachedReport {
  report: AggregatedReport;
  generatedAt: Date;
}

/**
 * Cache in-memory de reportes generados, indexados por version.
 * Se crea una instancia por servidor y se inyecta via contexto tRPC.
 * Los reportes viven hasta que se limpian o el servidor se reinicia.
 */
export class ReportStore {
  private reports = new Map<string, CachedReport>();

  getReport(version: string): AggregatedReport {
    const entry = this.reports.get(version);
    if (!entry) {
      throw new Error(`No report available for version "${version}". Generate it first using report.generate`);
    }
    return entry.report;
  }

  setReport(version: string, report: AggregatedReport): void {
    this.reports.set(version, { report, generatedAt: new Date() });
  }

  hasReport(version: string): boolean {
    return this.reports.has(version);
  }

  getGeneratedAt(version: string): Date | null {
    return this.reports.get(version)?.generatedAt ?? null;
  }

  getVersions(): Array<{ version: string; generatedAt: Date }> {
    return [...this.reports.entries()].map(([version, entry]) => ({
      version,
      generatedAt: entry.generatedAt,
    }));
  }

  clear(version?: string): void {
    if (version) {
      this.reports.delete(version);
    } else {
      this.reports.clear();
    }
  }
}
