import {
  PieChart, Pie, Cell, Label,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatTime, formatNumber, formatPassRate } from '@/lib/format'
import { KpiCard } from '@/components/shared/kpi-card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const PIE_PASSED = '#10b981'
const PIE_FAILED = '#ef4444'

function rateColor(rate: number) {
  if (rate >= 90) return '#10b981'
  if (rate >= 70) return '#f59e0b'
  return '#ef4444'
}

function CategoryRow({ category, passRate, executionCount }: {
  category: string
  passRate: number
  executionCount: number
}) {
  const color = rateColor(passRate)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-800">{category}</span>
        <span className="text-xs text-slate-500 tabular-nums">
          {executionCount} ejec.&nbsp;·&nbsp;
          <span className="font-semibold" style={{ color }}>{passRate.toFixed(1)}%</span>
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${passRate}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { version } = useVersion()

  const summary    = trpc.report.globalSummary.useQuery({ version: version! })
  const categories = trpc.report.categories.useQuery({ version: version! })
  const executions = trpc.report.executions.useQuery({
    version: version!,
    sortBy: { field: 'executionDate', direction: 'desc' },
    pagination: { limit: 10, offset: 0 },
  })

  if (summary.isLoading || categories.isLoading) return <LoadingSkeleton />
  if (summary.isError)    return <ErrorFallback message={summary.error.message}    onRetry={() => summary.refetch()} />
  if (categories.isError) return <ErrorFallback message={categories.error.message} onRetry={() => categories.refetch()} />

  const s    = summary.data!
  const cats = categories.data ?? []

  const avgTime = s.totalTestCases > 0 ? s.totalTime / s.totalTestCases : 0

  const pieData = [
    { name: 'Exitosos', value: s.totalPassed },
    { name: 'Fallidos', value: s.totalFailed },
  ]

  const execTotal = executions.data?.total ?? 0
  const execItems = executions.data?.items ?? []
  const trendData = [...execItems].reverse().map((exec, i) => {
    const passed = Math.max(0, exec.totalTests - exec.totalFailures - exec.totalErrors)
    const rate   = exec.totalTests > 0
      ? Number((passed / exec.totalTests * 100).toFixed(1))
      : 100
    const execNum = execTotal - execItems.length + i + 1
    return { name: `#${execNum}`, passRate: rate }
  })

  const minRate = trendData.length > 0
    ? Math.max(0, Math.floor(Math.min(...trendData.map((d) => d.passRate)) / 5) * 5)
    : 0

  return (
    <div className="space-y-5">

      {/* Summary banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-sm text-slate-600 leading-relaxed">
        Se ejecutaron{' '}
        <span className="font-bold text-blue-700">{formatNumber(s.totalExecutions)} ejecuciones E2E</span>{' '}
        con{' '}
        <span className="font-bold text-slate-900">{formatNumber(s.totalTestCases)} casos de prueba</span>{' '}
        en{' '}
        <span className="font-bold text-blue-700">{formatTime(s.totalTime)}</span>.{' '}
        Tasa de éxito:{' '}
        <span className="font-bold" style={{ color: rateColor(s.globalPassRate) }}>
          {formatPassRate(s.globalPassRate)}
        </span>.
        {s.totalFailed > 0 && (
          <>
            {' '}<span className="font-bold text-red-600">
              {formatNumber(s.totalFailed)} test{s.totalFailed !== 1 ? 's' : ''} fallido{s.totalFailed !== 1 ? 's' : ''}
            </span> detectado{s.totalFailed !== 1 ? 's' : ''}.
          </>
        )}
      </div>

      {/* KPI row – 7 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard title="Ejecuciones E2E"  value={formatNumber(s.totalExecutions)}   color="blue"   />
        <KpiCard title="Casos de Prueba"  value={formatNumber(s.totalTestCases)}    color="gray"   />
        <KpiCard title="Tests Exitosos"   value={formatNumber(s.totalPassed)}       color="green"  />
        <KpiCard title="Tests Fallidos"   value={formatNumber(s.totalFailed)}       color="red"    />
        <KpiCard title="Tasa de Éxito"    value={formatPassRate(s.globalPassRate)}  color="green"  />
        <KpiCard title="Tiempo Total"     value={formatTime(s.totalTime)}           color="blue"   />
        <KpiCard title="Prom. por Test"   value={formatTime(avgTime)}              color="purple" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left: Trend line chart */}
        {trendData.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="px-5 pt-4 pb-1 flex-row items-center justify-between space-y-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Tendencia — Últimas {trendData.length} Ejecuciones
              </p>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Pass Rate
              </span>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-2">
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[minRate, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                    }}
                    formatter={(v: number) => [`${v}%`, 'Pass Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="passRate"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Right: Distribution by category */}
        {cats.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="px-5 pt-4 pb-1 space-y-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Distribución por Categoría
              </p>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-3">
              <div className="flex gap-6 items-start">

                {/* Donut + legend */}
                <div className="shrink-0 flex flex-col items-center">
                  <PieChart width={148} height={148}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={66}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        <Cell fill={PIE_PASSED} />
                        <Cell fill={PIE_FAILED} />
                        <Label
                          content={({ viewBox }: { viewBox?: { cx?: number; cy?: number } }) => {
                            const cx = viewBox?.cx ?? 0
                            const cy = viewBox?.cy ?? 0
                            return (
                              <g>
                                <text x={cx} y={cy - 4} textAnchor="middle" fontSize={17} fontWeight={700} fill={rateColor(s.globalPassRate)}>
                                  {s.globalPassRate.toFixed(1)}%
                                </text>
                                <text x={cx} y={cy + 11} textAnchor="middle" fontSize={8} fill="#94a3b8" letterSpacing="0.08em">
                                  PASS RATE
                                </text>
                              </g>
                            )
                          }}
                        />
                      </Pie>
                  </PieChart>

                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_PASSED }} />
                      Exitosos{' '}
                      <span className="font-semibold text-slate-900">{formatNumber(s.totalPassed)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_FAILED }} />
                      Fallidos{' '}
                      <span className="font-semibold text-slate-900">{formatNumber(s.totalFailed)}</span>
                    </div>
                  </div>
                </div>

                {/* Category bars */}
                <div className="flex-1 space-y-3 pt-1">
                  {cats.map((cat) => (
                    <CategoryRow
                      key={cat.category}
                      category={cat.category}
                      passRate={cat.passRate}
                      executionCount={cat.executionCount}
                    />
                  ))}
                </div>

              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
