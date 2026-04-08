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

type Metric = 'avgTime' | 'maxTime' | 'totalTime'
type SortField = 'testCaseName' | 'executionCount' | 'avgTime' | 'maxTime' | 'totalTime' | 'minTime'

const metricLabels: Record<Metric, string> = {
  avgTime: 'Average Time',
  maxTime: 'Max Time',
  totalTime: 'Total Time',
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
  const [metric, setMetric] = useState<Metric>('avgTime')
  const [topN, setTopN] = useState(10)
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'avgTime',
    direction: 'desc',
  })

  const query = trpc.report.slowestTests.useQuery({
    version: version!,
    metric,
    topN,
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

  const chartData = sortedData.map((d) => ({
    name: d.testCaseName.length > 30 ? d.testCaseName.slice(0, 30) + '...' : d.testCaseName,
    value: d[metric],
  }))

  function metricColumnClass(target: Metric) {
    return target === metric ? 'text-right font-semibold text-foreground' : 'text-right'
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
        <span className="truncate max-w-[300px] block" title={r.testCaseName}>
          {r.testCaseName}
        </span>
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
      <PageHeader title="Slowest Tests" description="Ranking de pruebas más lentas, con acceso directo a los productos relacionados" />
      <div className="flex gap-3">
        <Select
          value={metric}
          onChange={(e) => {
            const nextMetric = e.target.value as Metric
            setMetric(nextMetric)
            setSort({ field: nextMetric, direction: 'desc' })
          }}
          className="w-48"
        >
          {(Object.keys(metricLabels) as Metric[]).map((m) => (
            <option key={m} value={m}>{metricLabels[m]}</option>
          ))}
        </Select>
        <Select value={String(topN)} onChange={(e) => setTopN(Number(e.target.value))} className="w-32">
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>Top {n}</option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{metricLabels[metric]}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 35)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value: number) => formatTime(value)} />
              <YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatTime(value)} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
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
