import { publicProcedure } from '../trpc.js'
import { REPORT_SOURCE_NODE_KIND } from '../../../domain/constants/index.js'
import type { ReportSourceNode } from '../../../domain/value-objects/index.js'

export interface ReportSourceResponseNode extends ReportSourceNode {
  cached: boolean;
  generatedAt: string | null;
  children: ReportSourceResponseNode[];
}

export const sources = publicProcedure.query(async ({ ctx }) => {
  const sourceNodes = await ctx.reportSourceCatalog.discover()
  return sourceNodes.map((node) => addCacheState(node, ctx.reportStore))
})

function addCacheState(
  node: ReportSourceNode,
  reportStore: { hasReport(sourceId: string): boolean; getGeneratedAt(sourceId: string): Date | null },
): ReportSourceResponseNode {
  const isSource = node.kind === REPORT_SOURCE_NODE_KIND.SOURCE
  const generatedAt = isSource ? reportStore.getGeneratedAt(node.path) : null

  return {
    ...node,
    cached: isSource && reportStore.hasReport(node.path),
    generatedAt: generatedAt?.toISOString() ?? null,
    children: node.children.map((child) => addCacheState(child, reportStore)),
  }
}
