import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { keepPreviousData } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type SortField = 'product' | 'category' | 'executionCount' | 'passRate'

interface ProductRow {
  product: string
  category: string
  executionCount: number
  passRate: number
  tags: string[]
}

const compactHeaderClassName = 'text-[10px] tracking-[0.14em]'
const compactHeaderButtonClassName = 'text-[10px] tracking-[0.12em]'

function SubPathBadges({ tags }: { tags: string[] }) {
  const unique = [...new Set(tags)]
  if (unique.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
      {unique.map((tag, index) => (
        <div key={tag} className="inline-flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3 w-3 opacity-45" />}
          <span className={index === unique.length - 1 ? 'font-medium text-foreground' : ''}>{tag}</span>
        </div>
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

  const query = trpc.report.products.useQuery(
    {
      version: version!,
      category: categoryFilter,
      search: debouncedSearch || undefined,
      sortBy: sort,
      pagination: { limit: pagination.pageSize, offset: pagination.offset },
    },
    {
      placeholderData: keepPreviousData,
    },
  )

  const handleSort = useCallback((field: string) => {
    setSort((prev) => ({
      field: field as SortField,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
    pagination.resetPage()
  }, [pagination])

  const columns: Column<ProductRow>[] = [
    {
      key: 'product',
      header: 'Ejecucion',
      sortable: true,
      headerClassName: compactHeaderClassName,
      headerButtonClassName: compactHeaderButtonClassName,
      render: (r) => r.product,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      headerClassName: compactHeaderClassName,
      headerButtonClassName: compactHeaderButtonClassName,
      render: (r) => r.category,
    },
    {
      key: 'tags',
      header: 'Subpath',
      headerClassName: compactHeaderClassName,
      render: (r) => <SubPathBadges tags={r.tags} />,
    },
    {
      key: 'executionCount',
      header: 'Runs',
      sortable: true,
      className: 'text-right',
      headerClassName: compactHeaderClassName,
      headerButtonClassName: compactHeaderButtonClassName,
      render: (r) => formatNumber(r.executionCount),
    },
    {
      key: 'passRate',
      header: 'Pass Rate',
      sortable: true,
      className: 'text-right',
      headerClassName: compactHeaderClassName,
      headerButtonClassName: compactHeaderButtonClassName,
      render: (r) => <PassRateBadge rate={r.passRate} />,
    },
  ]

  if (query.isLoading && !query.data) return <TableSkeleton />
  if (query.isError && !query.data) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const result = query.data!
  const categories = categoriesQuery.data ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        description={
          categoryFilter
            ? `Vista enfocada en la categoria ${categoryFilter}. Aqui puedes comparar ejecuciones por volumen, tasa de exito y subruta operativa para detectar donde se concentra la actividad y que grupo necesita revision.`
            : 'Listado consolidado por ejecucion. Sirve para comparar carga, estabilidad general y contexto de subruta en una sola tabla antes de entrar al detalle de cada ejecucion.'
        }
      />
      <div className="rounded-md border border-border/25 bg-card px-4 py-4">
        <div className="flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); pagination.resetPage() }}
            placeholder="Buscar ejecuciones..."
            className="max-w-sm"
          />
          <Select
            value={categoryFilter ?? ''}
            onChange={(e) => {
              const next = e.target.value
              pagination.resetPage()
              navigate(next ? `/products?category=${encodeURIComponent(next)}` : '/products')
            }}
            className="h-10 w-56 rounded-md border-border/40 bg-card shadow-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>{c.category}</option>
            ))}
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {categoryFilter ? (
            <>
              <span>Filtro activo:</span>
              <Badge variant="secondary" className="rounded-md border border-border/30 bg-secondary text-muted-foreground">
                {categoryFilter}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-md px-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => {
                  pagination.resetPage()
                  navigate('/products')
                }}
              >
                Limpiar filtro
              </Button>
            </>
          ) : (
            <span>Usa los filtros para enfocarte en una categoría específica sin salir del listado.</span>
          )}
        </div>
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
