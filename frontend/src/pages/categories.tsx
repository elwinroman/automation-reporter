import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatTime, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PassRateBadge } from '@/components/shared/pass-rate-badge'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

type SortField = 'category' | 'executionCount' | 'passRate' | 'totalTime';

interface CategoryRow {
  category: string;
  executionCount: number;
  passRate: number;
  totalTime: number;
}

export default function Categories() {
  const { version } = useVersion()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'category',
    direction: 'asc',
  })
  const debouncedSearch = useDebouncedValue(search)

  const query = trpc.report.categories.useQuery({
    version: version!,
    sortBy: sort,
  })

  const handleSort = useCallback((field: string) => {
    setSort((prev) => ({
      field: field as SortField,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const columns: Column<CategoryRow>[] = [
    { key: 'category', header: 'Category', sortable: true, render: (r) => r.category },
    { key: 'executionCount', header: 'Ejec. E2E', sortable: true, className: 'text-right', render: (r) => formatNumber(r.executionCount) },
    { key: 'passRate', header: 'Pass Rate', sortable: true, className: 'text-right', render: (r) => <PassRateBadge rate={r.passRate} /> },
    { key: 'totalTime', header: 'Total Time', sortable: true, className: 'text-right', render: (r) => formatTime(r.totalTime) },
  ]

  if (query.isLoading) return <TableSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const filtered = debouncedSearch
    ? (query.data ?? []).filter((c) => c.category.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : query.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader title="Categories" description="Test results grouped by category" />
      <SearchInput value={search} onChange={setSearch} placeholder="Filter categories..." className="max-w-sm" />
      <DataTable
        columns={columns}
        data={filtered}
        sort={sort}
        onSort={handleSort}
        onRowClick={(row) => navigate(`/products?category=${encodeURIComponent(row.category)}`)}
      />
    </div>
  )
}
