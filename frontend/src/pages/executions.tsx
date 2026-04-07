import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatTime, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { usePagination } from '@/hooks/use-pagination'

type SortField = 'filePath' | 'category' | 'product' | 'executionDate' | 'totalTests' | 'totalTime';

interface ExecutionRow {
  filePath: string;
  metadata: {
    category: string;
    product: string;
    executionDate: string;
    rawFolderName: string;
  };
  totalTests: number;
  totalFailures: number;
  totalErrors: number;
  totalTime: number;
}

export default function Executions() {
  const { version } = useVersion()
  const pagination = usePagination({ pageSize: 20 })
  const [category, setCategory] = useState<string>('')
  const [product, setProduct] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'executionDate',
    direction: 'desc',
  })

  const categoriesQuery = trpc.report.categories.useQuery({ version: version! })

  const dateRange = (dateFrom || dateTo)
    ? { from: dateFrom ? new Date(dateFrom).toISOString() : undefined, to: dateTo ? new Date(dateTo).toISOString() : undefined }
    : undefined

  const query = trpc.report.executions.useQuery({
    version: version!,
    category: category || undefined,
    product: product || undefined,
    dateRange,
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

  const columns: Column<ExecutionRow>[] = [
    { key: 'filePath', header: 'File', sortable: true, render: (r) => <span className="truncate max-w-[200px] block text-xs">{r.metadata.rawFolderName}</span> },
    { key: 'category', header: 'Category', sortable: true, render: (r) => r.metadata.category },
    { key: 'product', header: 'Product', sortable: true, render: (r) => r.metadata.product },
    { key: 'executionDate', header: 'Date', sortable: true, render: (r) => new Date(r.metadata.executionDate).toLocaleString() },
    { key: 'totalTests', header: 'Tests', sortable: true, className: 'text-right', render: (r) => formatNumber(r.totalTests) },
    {
      key: 'failures', header: 'Failures', className: 'text-right',
      render: (r) => {
        const total = r.totalFailures + r.totalErrors
        return <span className={total > 0 ? 'text-red-600 font-medium' : ''}>{total}</span>
      },
    },
    { key: 'totalTime', header: 'Time', sortable: true, className: 'text-right', render: (r) => formatTime(r.totalTime) },
  ]

  if (query.isLoading) return <TableSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const result = query.data!
  const cats = categoriesQuery.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader title="Ejecuciones E2E" description="Ejecuciones E2E individuales — cada una encadena múltiples escenarios de un mismo producto" />
      <div className="flex flex-wrap gap-3">
        <Select value={category} onChange={(e) => { setCategory(e.target.value); pagination.resetPage() }} className="w-48">
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.category} value={c.category}>{c.category}</option>
          ))}
        </Select>
        <Input
          type="text"
          placeholder="Filter by product..."
          value={product}
          onChange={(e) => { setProduct(e.target.value); pagination.resetPage() }}
          className="w-48"
        />
        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); pagination.resetPage() }} className="w-40" />
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); pagination.resetPage() }} className="w-40" />
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
