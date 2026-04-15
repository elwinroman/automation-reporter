import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { keepPreviousData } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
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
import { Tooltip } from '@/components/ui/tooltip'
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

const compactHeaderClassName = 'text-[10px] tracking-[0.14em]'
const compactHeaderButtonClassName = 'text-[10px] tracking-[0.12em]'

function ProductBadges({
  products,
  onSelectProduct,
}: {
  products: string[];
  onSelectProduct: (product: string) => void;
}) {
  const unique = [...new Set(products)]
  if (unique.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {unique.map((product) => (
        <button
          type="button"
          key={product}
          onClick={(e) => {
            e.stopPropagation()
            onSelectProduct(product)
          }}
          className="inline-flex items-center gap-1 rounded-md border border-border/30 bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
        >
          {product}
          <ArrowUpRight className="h-3 w-3 opacity-70" />
        </button>
      ))}
    </div>
  )
}

export default function TestCases() {
  const { version } = useVersion()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusType, setStatusType] = useState<StatusType>('all')
  const debouncedSearch = useDebouncedValue(search)
  const pagination = usePagination({ pageSize: 20 })
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'testCaseName',
    direction: 'asc',
  })

  const query = trpc.report.testCases.useQuery(
    {
      version: version!,
      statusType,
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

  const columns: Column<TestCaseRow>[] = [
    {
      key: 'testCaseName',
      header: 'Test Case',
      sortable: true,
      headerClassName: compactHeaderClassName,
      headerButtonClassName: compactHeaderButtonClassName,
      render: (r) => (
        <Tooltip content={<div className="max-w-md break-words text-xs">{r.testCaseName}</div>}>
          <span className="block max-w-[300px] truncate">{r.testCaseName}</span>
        </Tooltip>
      ),
    },
    {
      key: 'products',
      header: 'Ejecuciones',
      headerClassName: compactHeaderClassName,
      render: (r) => (
        <ProductBadges
          products={r.products}
          onSelectProduct={(product) => navigate(`/products/${encodeURIComponent(product)}`)}
        />
      ),
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
      key: 'passCount',
      header: 'Passed',
      sortable: true,
      className: 'text-right',
      headerClassName: compactHeaderClassName,
      headerButtonClassName: compactHeaderButtonClassName,
      render: (r) => r.passCount,
    },
    {
      key: 'failCount',
      header: 'Failed',
      sortable: true,
      className: 'text-right',
      headerClassName: compactHeaderClassName,
      headerButtonClassName: compactHeaderButtonClassName,
      render: (r) => r.failCount,
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
    {
      key: 'avgTime',
      header: 'Avg Time',
      sortable: true,
      className: 'text-right',
      headerClassName: compactHeaderClassName,
      headerButtonClassName: compactHeaderButtonClassName,
      render: (r) => formatTime(r.avgTime),
    },
  ]

  if (query.isLoading && !query.data) return <TableSkeleton />
  if (query.isError && !query.data) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const result = query.data!

  return (
    <div className="space-y-5">
      <PageHeader
        description="Resultados agregados por caso de prueba a traves de multiples ejecuciones. Esta vista te ayuda a identificar frecuencia de uso, estabilidad, tiempo promedio y relacion con ejecuciones concretas sin perder el contexto comparativo."
      />
      <div className="rounded-md border border-border/25 bg-card px-4 py-4">
        <div className="flex flex-col gap-4">
          <Tabs value={statusType} onValueChange={(v) => { setStatusType(v as StatusType); pagination.resetPage() }}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="flaky">Flaky</TabsTrigger>
              <TabsTrigger value="always-passing">Estables</TabsTrigger>
              <TabsTrigger value="always-failing">Fallando</TabsTrigger>
            </TabsList>
          </Tabs>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); pagination.resetPage() }}
            placeholder="Buscar casos de prueba..."
            className="max-w-sm"
          />
          <p className="text-sm text-muted-foreground">
            Filtra por estabilidad o busca un caso especifico para revisar su comportamiento entre ejecuciones.
          </p>
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

