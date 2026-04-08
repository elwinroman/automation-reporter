import { useState } from 'react'
import { useParams } from 'react-router'
import { trpc } from '@/lib/trpc'
import { REPORTS_BASE_URL } from '@/lib/constants'
import { useVersion } from '@/context/version-context'
import { formatTime, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { PassRateBadge } from '@/components/shared/pass-rate-badge'
import { DataTable, type Column } from '@/components/shared/data-table'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TestCaseRow {
  testCaseName: string;
  executionCount: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgTime: number;
}

export default function ProductDetail() {
  const { product } = useParams<{ product: string }>()
  const { version } = useVersion()

  const [expandedRun, setExpandedRun] = useState<number | null>(null)

  const query = trpc.report.productDetail.useQuery({
    version: version!,
    product: product!,
  })

  if (query.isLoading) return <LoadingSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const d = query.data!

  const testColumns: Column<TestCaseRow>[] = [
    { key: 'testCaseName', header: 'Caso de prueba', render: (r) => <span className="truncate max-w-[300px] block">{r.testCaseName}</span> },
    { key: 'executionCount', header: 'Ejecuciones', className: 'text-right', render: (r) => formatNumber(r.executionCount) },
    { key: 'passCount', header: 'Exitosos', className: 'text-right', render: (r) => r.passCount },
    { key: 'failCount', header: 'Fallidos', className: 'text-right', render: (r) => r.failCount },
    { key: 'passRate', header: 'Tasa de éxito', className: 'text-right', render: (r) => <PassRateBadge rate={r.passRate} /> },
    { key: 'avgTime', header: 'Tiempo prom.', className: 'text-right', render: (r) => formatTime(r.avgTime) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={d.product} description={d.category} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Producto"        value={d.product}                       color="gray"   />
        <KpiCard title="Categoría"       value={d.category}                      color="blue"   />
        <KpiCard title="Nro ejecuciones"  value={formatNumber(d.executionCount)}  color="blue"   />
        <KpiCard title="Tasa de éxito"   value={`${d.passRate.toFixed(1)}%`}     color="green"  />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Historial de ejecuciones
            <Badge variant="secondary">{d.runs.length} ejecuciones</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {d.runs.map((run, i) => {
              const isOpen = expandedRun === i
              const passRate = run.tests > 0 ? (run.passed / run.tests) * 100 : 0
              return (
                <div key={i}>
                  {/* Fila de la ejecución */}
                  <div className="flex items-center hover:bg-slate-50 transition-colors">
                    <button
                      className="flex-1 text-left px-6 py-3 flex items-center gap-4"
                      onClick={() => setExpandedRun(isOpen ? null : i)}
                    >
                      <span className="text-slate-400 text-xs w-4">{isOpen ? '▾' : '▸'}</span>
                      <span className="flex-1 text-xs text-slate-500">
                        {run.path.split('\\').map((seg, si, arr) => (
                          <span key={si}>
                            {si > 0 && <span className="mx-1 text-slate-300">›</span>}
                            <span className={si === arr.length - 1 ? 'font-medium text-slate-700' : ''}>{seg}</span>
                          </span>
                        ))}
                      </span>
                      <span className="text-xs text-slate-500 w-36 shrink-0">
                        {new Date(run.executionDate).toLocaleString('es')}
                      </span>
                      <span className="text-xs text-slate-500 w-16 text-right shrink-0">{run.tests} tests</span>
                      <span className="text-xs text-emerald-600 w-16 text-right shrink-0">{run.passed} ok</span>
                      <span className={`text-xs w-16 text-right shrink-0 ${run.failed > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                        {run.failed} fail
                      </span>
                      <span className="w-20 text-right shrink-0">
                        <PassRateBadge rate={passRate} />
                      </span>
                      <span className="text-xs text-slate-500 w-16 text-right shrink-0">{formatTime(run.time)}</span>
                    </button>
                    <a
                      href={`${REPORTS_BASE_URL}/${run.indexHtml.replace(/\\/g, '/').replace(/index\.html$/, '').split('/').map(encodeURIComponent).join('/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver reporte"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-3 text-slate-300 hover:text-blue-500 transition-colors shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>

                  {/* Test cases expandidos */}
                  {isOpen && run.testCases.length > 0 && (
                    <div className="bg-slate-50 border-t border-slate-100 px-6 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400 uppercase tracking-wide">
                            <th className="text-left pb-2 font-medium">Caso de prueba</th>
                            <th className="text-right pb-2 font-medium w-20">Duración</th>
                            <th className="text-center pb-2 font-medium w-16">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {run.testCases.map((tc, ti) => (
                            <tr key={ti} className="group">
                              <td className="py-1.5 pr-4">
                                <span className="text-slate-700">{tc.name}</span>
                                {tc.failureMessages.length > 0 && (
                                  <p className="text-red-500 mt-0.5 truncate max-w-xl">{tc.failureMessages[0]}</p>
                                )}
                              </td>
                              <td className="py-1.5 text-right text-slate-500 tabular-nums">{formatTime(tc.time)}</td>
                              <td className="py-1.5 text-center">
                                {tc.status === 'passed'
                                  ? <span className="text-emerald-500">✓</span>
                                  : <span className="text-red-500 font-bold">✗</span>
                                }
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Casos de Prueba Relacionados
            <Badge variant="secondary">{d.relatedTestCases.length} casos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={testColumns} data={d.relatedTestCases} />
        </CardContent>
      </Card>
    </div>
  )
}
