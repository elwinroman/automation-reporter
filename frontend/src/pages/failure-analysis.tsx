import { useState } from 'react'
import { useNavigate } from 'react-router'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { DataTable, type Column } from '@/components/shared/data-table'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePagination } from '@/hooks/use-pagination'

interface FailureRow {
  message: string;
  occurrences: number;
  affectedTests: string[];
  affectedProducts: string[];
}

export default function FailureAnalysis() {
  const navigate = useNavigate()
  const { version } = useVersion()
  const [search, setSearch] = useState('')
  const [minOccurrences, setMinOccurrences] = useState(1)
  const [product, setProduct] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const pagination = usePagination({ pageSize: 20 })

  const query = trpc.report.failureAnalysis.useQuery({
    version: version!,
    minOccurrences,
    product: product || undefined,
    search: debouncedSearch || undefined,
    pagination: { limit: pagination.pageSize, offset: pagination.offset },
  })

  const columns: Column<FailureRow>[] = [
    {
      key: 'message',
      header: 'Error Message',
      render: (r) => (
        <Tooltip content={<div className="max-w-lg whitespace-pre-wrap break-words text-xs leading-5">{r.message}</div>}>
          <div
            title={r.message}
            className="max-w-[460px] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {r.message}
          </div>
        </Tooltip>
      ),
    },
    { key: 'occurrences', header: 'Occurrences', className: 'text-right', render: (r) => <span className="text-red-600 font-medium">{formatNumber(r.occurrences)}</span> },
    {
      key: 'affectedTests', header: 'Affected Tests', className: 'text-right',
      render: (r) => (
        <Tooltip content={<div className="max-w-sm space-y-1">{r.affectedTests.slice(0, 10).map((t) => <div key={t} className="text-xs break-words">{t}</div>)}{r.affectedTests.length > 10 && <div className="text-xs">...and {r.affectedTests.length - 10} more</div>}</div>}>
          <Badge variant="secondary">{r.affectedTests.length}</Badge>
        </Tooltip>
      ),
    },
    {
      key: 'affectedProducts', header: 'Affected Products',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.affectedProducts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => navigate(`/products/${encodeURIComponent(p)}`)}
            >
              <Badge variant="outline" className="text-xs hover:bg-slate-100 cursor-pointer">{p}</Badge>
            </button>
          ))}
        </div>
      ),
    },
  ]

  if (query.isLoading) return <TableSkeleton />
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const result = query.data!

  return (
    <div className="space-y-4">
      <PageHeader title="Failure Analysis" description="Fallos agrupados por mensaje, con acceso directo a los productos afectados" />
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Min Occurrences</label>
          <Input type="number" min={1} value={minOccurrences} onChange={(e) => { setMinOccurrences(Number(e.target.value) || 1); pagination.resetPage() }} className="w-32" />
        </div>
        <Input
          type="text"
          placeholder="Filter by product..."
          value={product}
          onChange={(e) => { setProduct(e.target.value); pagination.resetPage() }}
          className="w-48"
        />
        <SearchInput value={search} onChange={(v) => { setSearch(v); pagination.resetPage() }} placeholder="Search error messages..." className="max-w-sm" />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        {product ? (
          <>
            <span>Filtro activo:</span>
            <Badge variant="secondary">{product}</Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-slate-600"
              onClick={() => {
                setProduct('')
                pagination.resetPage()
              }}
            >
              Limpiar filtro
            </Button>
          </>
        ) : (
          <span>Pasa el mouse sobre el mensaje o el conteo de tests para ver más detalle, y usa los badges para ir al producto afectado.</span>
        )}
      </div>
      <DataTable
        columns={columns}
        data={result.items}
        total={result.total}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={pagination.goToPage}
      />
    </div>
  )
}
