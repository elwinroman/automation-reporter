import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatTime, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PassRateBadge } from '@/components/shared/pass-rate-badge'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePagination } from '@/hooks/use-pagination'

type StatusType = 'all' | 'flaky' | 'always-passing' | 'always-failing';
type SortField = 'testCaseName' | 'executionCount' | 'passCount' | 'failCount' | 'passRate' | 'avgTime';

interface TestCaseRow {
  testCaseName: string;
  executionCount: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgTime: number;
  products: string[];
}

export default function TestCases() {
  const { version } = useVersion()
  const [search, setSearch] = useState('')
  const [statusType, setStatusType] = useState<StatusType>('all')
  const debouncedSearch = useDebouncedValue(search)
  const pagination = usePagination({ pageSize: 20 })
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'testCaseName',
    direction: 'asc',
  })

  const query = trpc.report.testCases.useQuery({
    version: version!,
    statusType,
    search: debouncedSearch || undefined,
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

  const columns: Column<TestCaseRow>[] = [
    { key: 'testCaseName', header: 'Test Case', sortable: true, render: (r) => <span className="truncate max-w-[300px] block">{r.testCaseName}</span> },
    { key: 'executionCount', header: 'Runs', sortable: true, className: 'text-right', render: (r) => formatNumber(r.executionCount) },
    { key: 'passCount', header: 'Passed', sortable: true, className: 'text-right', render: (r) => r.passCount },
    { key: 'failCount', header: 'Failed', sortable: true, className: 'text-right', render: (r) => r.failCount },
    { key: 'passRate', header: 'Pass Rate', sortable: true, className: 'text-right', render: (r) => <PassRateBadge rate={r.passRate} /> },
    { key: 'avgTime', header: 'Avg Time', sortable: true, className: 'text-right', render: (r) => formatTime(r.avgTime) },
  ]

  if (query.isLoading) return <TableSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const result = query.data!

  return (
    <div className="space-y-4">
      <PageHeader title="Test Cases" description="Aggregated test case results across all executions" />
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs value={statusType} onValueChange={(v) => { setStatusType(v as StatusType); pagination.resetPage() }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="flaky">Flaky</TabsTrigger>
            <TabsTrigger value="always-passing">Passing</TabsTrigger>
            <TabsTrigger value="always-failing">Failing</TabsTrigger>
          </TabsList>
        </Tabs>
        <SearchInput value={search} onChange={(v) => { setSearch(v); pagination.resetPage() }} placeholder="Search test cases..." className="max-w-sm" />
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
