import { useState } from 'react'
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

type Metric = 'avgTime' | 'maxTime' | 'totalTime';

const metricLabels: Record<Metric, string> = {
  avgTime: 'Average Time',
  maxTime: 'Max Time',
  totalTime: 'Total Time',
}

interface TestRow {
  testCaseName: string;
  executionCount: number;
  avgTime: number;
  maxTime: number;
  totalTime: number;
  minTime: number;
}

export default function SlowestTests() {
  const { version } = useVersion()
  const [metric, setMetric] = useState<Metric>('avgTime')
  const [topN, setTopN] = useState(10)

  const query = trpc.report.slowestTests.useQuery({
    version: version!,
    metric,
    topN,
  })

  if (query.isLoading) return <LoadingSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const data = query.data ?? []

  const chartData = data.map((d) => ({
    name: d.testCaseName.length > 30 ? d.testCaseName.slice(0, 30) + '...' : d.testCaseName,
    value: Number(d[metric].toFixed(2)),
  }))

  const columns: Column<TestRow>[] = [
    { key: 'testCaseName', header: 'Test Case', render: (r) => <span className="truncate max-w-[300px] block">{r.testCaseName}</span> },
    { key: 'executionCount', header: 'Runs', className: 'text-right', render: (r) => r.executionCount },
    { key: 'avgTime', header: 'Avg Time', className: 'text-right', render: (r) => formatTime(r.avgTime) },
    { key: 'maxTime', header: 'Max Time', className: 'text-right', render: (r) => formatTime(r.maxTime) },
    { key: 'totalTime', header: 'Total Time', className: 'text-right', render: (r) => formatTime(r.totalTime) },
    { key: 'minTime', header: 'Min Time', className: 'text-right', render: (r) => formatTime(r.minTime) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Slowest Tests" description="Tests consuming the most time" />
      <div className="flex gap-3">
        <Select value={metric} onChange={(e) => setMetric(e.target.value as Metric)} className="w-48">
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
          <CardTitle className="text-base">{metricLabels[metric]} (seconds)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 35)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => `${value}s`} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={data} />
    </div>
  )
}
