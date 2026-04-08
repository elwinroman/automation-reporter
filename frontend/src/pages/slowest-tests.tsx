import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatTime } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip as UiTooltip } from '@/components/ui/tooltip'

type SortField = 'testCaseName' | 'executionCount' | 'avgTime' | 'maxTime' | 'totalTime' | 'minTime'
type ChartMetric = 'executionCount' | 'avgTime' | 'maxTime' | 'totalTime' | 'minTime'

const chartLabels: Record<ChartMetric, string> = {
  executionCount: 'Runs',
  avgTime: 'Avg Time',
  maxTime: 'Max Time',
  totalTime: 'Total Time',
  minTime: 'Min Time',
}

const chartAxisColor = 'hsl(var(--muted-foreground))'
const chartGridColor = 'hsl(var(--border) / 0.35)'
const chartBarColor = 'hsl(var(--primary))'
const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border) / 0.8)',
  borderRadius: '0.2rem',
  boxShadow: '0 10px 30px hsl(0 0% 0% / 0.18)',
  color: 'hsl(var(--card-foreground))',
  fontSize: '11px',
  padding: '10px 12px',
}
const chartTooltipLabelStyle = {
  color: 'hsl(var(--foreground))',
  fontSize: '11px',
  fontWeight: 600,
  marginBottom: '2px',
}
const chartTooltipItemStyle = {
  color: 'hsl(var(--card-foreground))',
  fontSize: '11px',
  padding: 0,
}

interface TestRow {
  testCaseName: string
  executionCount: number
  avgTime: number
  maxTime: number
  totalTime: number
  minTime: number
  products: string[]
}

export default function SlowestTests() {
  const navigate = useNavigate()
  const { version } = useVersion()
  const [topN, setTopN] = useState(10)
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'avgTime',
    direction: 'desc',
  })

  const backendSort = sort.field === 'testCaseName'
    ? { field: 'totalTime' as const, direction: 'desc' as const }
    : { field: sort.field, direction: sort.direction }

  const query = trpc.report.slowestTests.useQuery({
    version: version!,
    topN,
    sortBy: backendSort,
  })

  const data = query.data ?? []
  const sortedData = useMemo(() => {
    const multiplier = sort.direction === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      if (sort.field === 'testCaseName') {
        return a.testCaseName.localeCompare(b.testCaseName) * multiplier
      }
      return (a[sort.field] - b[sort.field]) * multiplier
    })
  }, [data, sort])

  if (query.isLoading) return <LoadingSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const chartMetric: ChartMetric = sort.field === 'testCaseName' ? 'totalTime' : sort.field
  const chartData = sortedData.map((d) => ({
    name: d.testCaseName.length > 30 ? d.testCaseName.slice(0, 30) + '...' : d.testCaseName,
    fullName: d.testCaseName,
    value: d[chartMetric],
  }))

  function formatChartValue(value: number) {
    return chartMetric === 'executionCount' ? value.toString() : formatTime(value)
  }

  function metricColumnClass(target: 'avgTime' | 'maxTime' | 'totalTime') {
    return target === chartMetric ? 'text-right font-semibold text-foreground' : 'text-right'
  }

  function ProductBadges({ products }: { products: string[] }) {
    const unique = [...new Set(products)]
    return (
      <div className="flex flex-wrap gap-1">
        {unique.map((product) => (
          <button
            key={product}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/products/${encodeURIComponent(product)}`)
            }}
          >
            <Badge variant="secondary" className="cursor-pointer rounded-md border border-border/30 bg-secondary text-[11px] font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground">
              {product}
              <ArrowUpRight className="ml-1 h-3 w-3 opacity-70" />
            </Badge>
          </button>
        ))}
      </div>
    )
  }

  function handleSort(field: string) {
    setSort((prev) => ({
      field: field as SortField,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const columns: Column<TestRow>[] = [
    {
      key: 'testCaseName',
      header: 'Test Case',
      sortable: true,
      render: (r) => (
        <UiTooltip content={<div className="max-w-md break-words text-xs">{r.testCaseName}</div>}>
          <span className="truncate max-w-[300px] block">
            {r.testCaseName}
          </span>
        </UiTooltip>
      ),
    },
    { key: 'products', header: 'Products', render: (r) => <ProductBadges products={r.products} /> },
    { key: 'executionCount', header: 'Runs', sortable: true, className: 'text-right', render: (r) => r.executionCount },
    { key: 'avgTime', header: 'Avg Time', sortable: true, className: metricColumnClass('avgTime'), render: (r) => formatTime(r.avgTime) },
    { key: 'maxTime', header: 'Max Time', sortable: true, className: metricColumnClass('maxTime'), render: (r) => formatTime(r.maxTime) },
    { key: 'totalTime', header: 'Total Time', sortable: true, className: metricColumnClass('totalTime'), render: (r) => formatTime(r.totalTime) },
    { key: 'minTime', header: 'Min Time', sortable: true, className: 'text-right', render: (r) => formatTime(r.minTime) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Pruebas mas lentas" description="Ranking de pruebas más lentas, con acceso directo a los productos relacionados" />
      <div className="flex gap-3">
        <Select value={String(topN)} onChange={(e) => setTopN(Number(e.target.value))} className="w-32">
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>Top {n}</option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader className="px-4 pb-3 sm:px-6">
          <CardTitle className="text-base">{chartLabels[chartMetric]}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-5 sm:px-6">
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 35)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 8, bottom: 8, left: 12 }}>
              <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(value: number) => formatChartValue(value)}
                tick={{ fontSize: 10, fill: chartAxisColor }}
                axisLine={{ stroke: chartGridColor }}
                tickLine={{ stroke: chartGridColor }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={176}
                tick={{ fontSize: 10, fill: chartAxisColor }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatChartValue(value), 'Time']}
                labelFormatter={(_label, payload) => {
                  const item = payload?.[0]?.payload as { fullName?: string } | undefined
                  return item?.fullName ?? ''
                }}
                contentStyle={chartTooltipStyle}
                labelStyle={chartTooltipLabelStyle}
                itemStyle={chartTooltipItemStyle}
                cursor={{ fill: 'hsl(var(--primary) / 0.08)' }}
              />
              <Bar dataKey="value" fill={chartBarColor} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={sortedData}
        sort={sort}
        onSort={handleSort}
      />
    </div>
  )
}
