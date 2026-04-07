import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PassRateBadge } from '@/components/shared/pass-rate-badge'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { usePagination } from '@/hooks/use-pagination'

type SortField = 'testCaseName' | 'passRate' | 'executionCount' | 'failCount';

interface FlakyRow {
  testCaseName: string;
  executionCount: number;
  passCount: number;
  failCount: number;
  passRate: number;
  products: string[];
}

export default function FlakyTests() {
  const { version } = useVersion()
  const pagination = usePagination({ pageSize: 20 })
  const [minExecutions, setMinExecutions] = useState(2)
  const [minPassRate, setMinPassRate] = useState(0)
  const [maxPassRate, setMaxPassRate] = useState(100)
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'passRate',
    direction: 'asc',
  })

  const query = trpc.report.flakyTests.useQuery({
    version: version!,
    minExecutions,
    minPassRate,
    maxPassRate,
    sortBy: sort,
    pagination: { limit: pagination.pageSize, offset: pagination.offset },
  })

  const handleSort = useCallback((field: string) => {
    setSort((prev) => ({
      field: field as SortField,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
    pagination.resetPage()
  }, [pagination])

  const columns: Column<FlakyRow>[] = [
    { key: 'testCaseName', header: 'Test Case', sortable: true, render: (r) => <span className="truncate max-w-[300px] block">{r.testCaseName}</span> },
    { key: 'executionCount', header: 'Runs', sortable: true, className: 'text-right', render: (r) => formatNumber(r.executionCount) },
    { key: 'passCount', header: 'Passed', className: 'text-right', render: (r) => r.passCount },
    { key: 'failCount', header: 'Failed', sortable: true, className: 'text-right', render: (r) => <span className="text-red-600 font-medium">{r.failCount}</span> },
    { key: 'passRate', header: 'Pass Rate', sortable: true, className: 'text-right', render: (r) => <PassRateBadge rate={r.passRate} /> },
    {
      key: 'products', header: 'Products', render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.products.slice(0, 3).map((p) => (
            <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
          ))}
          {r.products.length > 3 && <Badge variant="outline" className="text-xs">+{r.products.length - 3}</Badge>}
        </div>
      ),
    },
  ]

  if (query.isLoading) return <TableSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const result = query.data!

  return (
    <div className="space-y-4">
      <PageHeader title="Flaky Tests" description="Tests with inconsistent pass/fail results" />
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Min Ejecuciones E2E</label>
          <Input type="number" min={1} value={minExecutions} onChange={(e) => { setMinExecutions(Number(e.target.value) || 2); pagination.resetPage() }} className="w-32" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Min Pass Rate %</label>
          <Input type="number" min={0} max={100} value={minPassRate} onChange={(e) => { setMinPassRate(Number(e.target.value) || 0); pagination.resetPage() }} className="w-32" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Max Pass Rate %</label>
          <Input type="number" min={0} max={100} value={maxPassRate} onChange={(e) => { setMaxPassRate(Number(e.target.value) || 100); pagination.resetPage() }} className="w-32" />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={result.items}
        sort={sort}
        onSort={handleSort}
        total={result.total}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={pagination.goToPage}
      />
    </div>
  )
}
