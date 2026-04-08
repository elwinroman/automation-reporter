import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PassRateBadge } from '@/components/shared/pass-rate-badge'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePagination } from '@/hooks/use-pagination'
import { Select } from '@/components/ui/select'

type SortField = 'product' | 'category' | 'executionCount' | 'passRate';

interface ProductRow {
  product: string;
  category: string;
  executionCount: number;
  passRate: number;
  tags: string[];
}

function SubPathBadges({ tags }: { tags: string[] }) {
  const unique = [...new Set(tags)]
  if (unique.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {unique.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

export default function Products() {
  const { version } = useVersion()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category') ?? undefined
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const pagination = usePagination({ pageSize: 20 })
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'product',
    direction: 'asc',
  })
  const categoriesQuery = trpc.report.categories.useQuery({ version: version! })

  const query = trpc.report.products.useQuery({
    version: version!,
    category: categoryFilter,
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

  const columns: Column<ProductRow>[] = [
    { key: 'product', header: 'Product', sortable: true, render: (r) => r.product },
    { key: 'category', header: 'Category', sortable: true, render: (r) => r.category },
    { key: 'tags', header: 'Sub-path', render: (r) => <SubPathBadges tags={r.tags} /> },
    { key: 'executionCount', header: 'Nro ejecuciones', sortable: true, className: 'text-right', render: (r) => formatNumber(r.executionCount) },
    { key: 'passRate', header: 'Pass Rate', sortable: true, className: 'text-right', render: (r) => <PassRateBadge rate={r.passRate} /> },
  ]

  if (query.isLoading) return <TableSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const result = query.data!
  const categories = categoriesQuery.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description={categoryFilter ? `Filtered by category: ${categoryFilter}` : 'Resultados agrupados por producto, con número de ejecuciones y pass rate'}
      />
      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); pagination.resetPage() }} placeholder="Search products..." className="max-w-sm" />
        <Select
          value={categoryFilter ?? ''}
          onChange={(e) => {
            const next = e.target.value
            pagination.resetPage()
            navigate(next ? `/products?category=${encodeURIComponent(next)}` : '/products')
          }}
          className="w-56"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>{c.category}</option>
          ))}
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={result.items}
        sort={sort}
        onSort={handleSort}
        onRowClick={(row) => navigate(`/products/${encodeURIComponent(row.product)}`)}
        total={result.total}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={pagination.goToPage}
      />
    </div>
  )
}
