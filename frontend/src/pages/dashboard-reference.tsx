import { PieChart, Pie, Cell, Label } from 'recharts'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatTime, formatNumber, formatPassRate, overallHealthStatus, passRateTone } from '@/lib/format'
import { KpiCard } from '@/components/shared/kpi-card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

const PIE_PASSED = 'hsl(var(--primary) / 0.78)'
const PIE_FAILED = 'hsl(var(--primary) / 0.18)'

function rateColor(rate: number) {
  const tone = passRateTone(rate)
  if (tone === 'good') return 'hsl(var(--primary))'
  if (tone === 'warning') return 'hsl(var(--warning))'
  return 'hsl(var(--destructive))'
}

function CategoryRow({
  category,
  passRate,
}: {
  category: string
  passRate: number
}) {
  const color = rateColor(passRate)

  return (
    <div className="group">
      <div className="mb-2 flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium text-muted-foreground">{category}</span>
        </div>
        <span className="text-sm font-semibold" style={{ color }}>
          {passRate.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-md bg-secondary">
        <div className="h-full rounded-md transition-all duration-700" style={{ width: `${passRate}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function DashboardReference() {
  const { version } = useVersion()

  const summary = trpc.report.globalSummary.useQuery({ version: version! })
  const categories = trpc.report.categories.useQuery({ version: version! })

  if (summary.isLoading || categories.isLoading) return <LoadingSkeleton />
  if (summary.isError) return <ErrorFallback message={summary.error.message} onRetry={() => summary.refetch()} />
  if (categories.isError) return <ErrorFallback message={categories.error.message} onRetry={() => categories.refetch()} />

  const s = summary.data!
  const cats = categories.data ?? []
  const avgTime = s.totalTestCases > 0 ? s.totalTime / s.totalTestCases : 0

  const pieData = [
    { name: 'Exitosos', value: s.totalPassed },
    { name: 'Fallidos', value: s.totalFailed },
  ]
  const healthStatus = overallHealthStatus(s.globalPassRate, s.totalFailed)
  const healthToneClasses = {
    good: 'border-border/20 bg-primary/90 text-primary-foreground',
    warning: 'border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning)/0.88)] text-black',
    critical: 'border-[hsl(var(--destructive)/0.25)] bg-destructive text-destructive-foreground',
  } as const
  const HealthIcon = {
    good: CheckCircle2,
    warning: AlertTriangle,
    critical: XCircle,
  }[healthStatus.tone]

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-md border border-border/30 bg-secondary px-7 py-5">
        <div className="flex flex-col gap-1.5">
          <span className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-foreground">Resumen Ejecutivo</span>
          <div className="flex flex-col gap-1 text-xs leading-5 md:text-sm">
            <p className="font-medium text-foreground">
              Tasa de exito: <span className="text-primary">{formatPassRate(s.globalPassRate)}</span>
            </p>
            <p className="text-muted-foreground">
              Se ejecutaron <span className="text-primary">{formatNumber(s.totalExecutions)} ejecuciones E2E</span> con{' '}
              <span className="text-primary">{formatNumber(s.uniqueTestCases)} casos de prueba unicos</span> y{' '}
              <span className="text-primary">{formatNumber(s.totalTestCases)} ejecuciones de test case</span> en{' '}
              <span className="text-primary">{formatTime(s.totalTime)}</span>.
            </p>
            {s.totalFailed > 0 && (
              <p className="text-destructive/85">{formatNumber(s.totalFailed)} tests fallidos detectados.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        <KpiCard title="Execs" value={formatNumber(s.totalExecutions)} color="gray" />
        <KpiCard title="Unique Cases" value={formatNumber(s.uniqueTestCases)} color="gray" />
        <KpiCard title="Case Runs" value={formatNumber(s.totalTestCases)} color="gray" />
        <KpiCard title="Success" value={formatNumber(s.totalPassed)} color="blue" />
        <KpiCard title="Failed" value={formatNumber(s.totalFailed)} color="red" />
        <KpiCard title="Rate" value={formatPassRate(s.globalPassRate)} color="blue" />
        <KpiCard title="Total Time" value={formatTime(s.totalTime)} color="gray" />
        <KpiCard title="Avg/Test" value={formatTime(avgTime)} color="gray" />
        <Card className={`rounded-md border shadow-none ${healthToneClasses[healthStatus.tone]}`}>
          <CardContent className="flex min-h-[112px] flex-col items-center justify-center gap-2 px-4 py-5 text-center">
            {HealthIcon && <HealthIcon className="h-6 w-6" />}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{healthStatus.label}</span>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <Card className="rounded-md border border-border/25 bg-card shadow-none lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-10">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Distribucion por categoria</h3>
            <span className="text-muted-foreground">...</span>
          </CardHeader>
          <CardContent className="space-y-8 p-8 pt-0">
            {cats.map((cat) => (
              <CategoryRow key={cat.category} category={cat.category} passRate={cat.passRate} />
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border/25 bg-card shadow-none">
          <CardHeader className="p-8 pb-12">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Tasa de exito global</h3>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-8 pt-0">
            <div className="relative flex h-48 w-48 items-center justify-center">
              <PieChart width={192} height={192}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={PIE_PASSED} />
                  <Cell fill={PIE_FAILED} />
                  <Label
                    content={({ viewBox }) => {
                      const pieViewBox = viewBox as { cx?: number; cy?: number } | undefined
                      const cx = pieViewBox?.cx ?? 0
                      const cy = pieViewBox?.cy ?? 0
                      return (
                        <g>
                          <text x={cx} y={cy - 2} textAnchor="middle" fontSize={28} fontWeight={800} fill="hsl(var(--foreground))">
                            {s.globalPassRate.toFixed(1)}%
                          </text>
                          <text x={cx} y={cy + 18} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" letterSpacing="0.16em">
                            GLOBAL PASS
                          </text>
                        </g>
                      )
                    }}
                  />
                </Pie>
              </PieChart>
            </div>
            <div className="mt-10 w-full space-y-3">
              <div className="flex items-center justify-between px-4 text-xs">
                <span className="font-medium text-muted-foreground">Test Exitosos</span>
                <span className="font-bold text-primary">{formatNumber(s.totalPassed)}</span>
              </div>
              <div className="flex items-center justify-between px-4 text-xs">
                <span className="font-medium text-muted-foreground">Test Fallidos</span>
                <span className="font-bold text-destructive">{formatNumber(s.totalFailed)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
