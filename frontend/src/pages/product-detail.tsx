import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { trpc } from '@/lib/trpc'
import { REPORTS_BASE_URL } from '@/lib/constants'
import { useVersion } from '@/context/version-context'
import { formatTime, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { PassRateBadge } from '@/components/shared/pass-rate-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function ProductDetail() {
  const navigate = useNavigate()
  const { product } = useParams<{ product: string }>()
  const { version } = useVersion()
  const [expandedRun, setExpandedRun] = useState<number | null>(0)

  const query = trpc.report.productDetail.useQuery({
    version: version!,
    product: product!,
  })

  if (query.isLoading) return <LoadingSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const d = query.data!

  return (
    <div className="space-y-6">
      <PageHeader title={d.product} description={d.category} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Producto" value={d.product} color="gray" />
        <KpiCard title="Categoría" value={d.category} color="blue" />
        <KpiCard title="Nro ejecuciones" value={formatNumber(d.executionCount)} color="blue" />
        <KpiCard title="Tasa de éxito" value={`${d.passRate.toFixed(1)}%`} color="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Historial de ejecuciones
            <Badge variant="secondary">{d.runs.length} ejecuciones</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {d.runs.map((run, i) => {
              const isOpen = expandedRun === i
              const passRate = run.tests > 0 ? (run.passed / run.tests) * 100 : 0
              return (
                <div key={i}>
                  <div className="flex items-center gap-4 px-6 py-3">
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-4 text-left"
                      onClick={() => setExpandedRun(isOpen ? null : i)}
                    >
                      <span className="w-4 text-xs text-muted-foreground">{isOpen ? '▾' : '▸'}</span>
                      <span className="flex-1 text-xs text-muted-foreground">
                        {run.path.split('\\').map((seg, si, arr) => (
                          <span key={si}>
                            {si > 0 && <span className="mx-1 text-border">›</span>}
                            <span className={si === arr.length - 1 ? 'font-medium text-foreground' : ''}>{seg}</span>
                          </span>
                        ))}
                      </span>
                      <span className="w-36 shrink-0 text-xs text-muted-foreground">
                        {new Date(run.executionDate).toLocaleString('es')}
                      </span>
                      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{run.tests} tests</span>
                      <span className="w-16 shrink-0 text-right text-xs text-[hsl(var(--success))]">{run.passed} ok</span>
                      <span className={`w-16 shrink-0 text-right text-xs ${run.failed > 0 ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
                        {run.failed} fail
                      </span>
                      <span className="w-20 shrink-0 text-right">
                        <PassRateBadge rate={passRate} />
                      </span>
                      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{formatTime(run.time)}</span>
                    </button>
                    <a
                      href={`${REPORTS_BASE_URL}/${run.indexHtml.replace(/\\/g, '/').replace(/index\.html$/, '').split('/').map(encodeURIComponent).join('/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver reporte"
                      className="shrink-0 px-3 py-3 text-muted-foreground/60 transition-colors hover:text-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>

                  {isOpen && run.testCases.length > 0 && (
                    <div className="border-t border-border bg-muted/40 px-6 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="uppercase tracking-wide text-muted-foreground">
                            <th className="pb-2 text-left font-medium">Test Case</th>
                            <th className="w-20 pb-2 text-right font-medium">Duration</th>
                            <th className="w-16 pb-2 text-center font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {run.testCases.map((tc, ti) => (
                            <tr key={ti} className="group">
                              <td className="py-1.5 pr-4">
                                <span className="text-foreground">{tc.name}</span>
                                {tc.failureMessages.length > 0 && (
                                  <p className="mt-0.5 max-w-xl truncate text-destructive">{tc.failureMessages[0]}</p>
                                )}
                              </td>
                              <td className="py-1.5 text-right tabular-nums text-muted-foreground">{formatTime(tc.time)}</td>
                              <td className="py-1.5 text-center">
                                {tc.status === 'passed'
                                  ? <span className="text-[hsl(var(--success))]">✓</span>
                                  : <span className="font-bold text-destructive">✗</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{formatNumber(d.relatedTestCases.length)} test cases relacionados disponibles en la vista dedicada.</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/test-cases')}
          >
            Ver Test Cases
          </Button>
        </div>
      </div>
    </div>
  )
}
