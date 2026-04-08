import { useState } from 'react'
import { useNavigate } from 'react-router'
import { keepPreviousData } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
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

  const query = trpc.report.failureAnalysis.useQuery(
    {
      version: version!,
      minOccurrences,
      product: product || undefined,
      search: debouncedSearch || undefined,
      pagination: { limit: pagination.pageSize, offset: pagination.offset },
    },
    {
      placeholderData: keepPreviousData,
    },
  )

  const columns: Column<FailureRow>[] = [
    {
      key: 'message',
      header: 'Mensaje',
      render: (r) => (
        <Tooltip content={<div className="max-w-lg whitespace-pre-wrap break-words text-xs leading-5">{r.message}</div>}>
          <div
            title={r.message}
            className="max-w-[460px] rounded-md border border-border/25 bg-secondary px-3 py-2 text-xs leading-5 text-foreground"
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
    {
      key: 'occurrences',
      header: 'Ocurrencias',
      className: 'text-right',
      render: (r) => <span className="font-medium text-destructive">{formatNumber(r.occurrences)}</span>,
    },
    {
      key: 'affectedTests',
      header: 'Tests afectados',
      className: 'text-right',
      render: (r) => (
        <Tooltip
          content={
            <div className="max-w-sm space-y-1">
              {r.affectedTests.slice(0, 10).map((t) => <div key={t} className="break-words text-xs">{t}</div>)}
              {r.affectedTests.length > 10 && <div className="text-xs">...y {r.affectedTests.length - 10} mas</div>}
            </div>
          }
        >
          <Badge variant="secondary" className="rounded-md border border-border/30 bg-secondary text-[11px] font-medium text-muted-foreground">
            {r.affectedTests.length}
          </Badge>
        </Tooltip>
      ),
    },
    {
      key: 'affectedProducts',
      header: 'Productos afectados',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.affectedProducts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => navigate(`/products/${encodeURIComponent(p)}`)}
            >
              <Badge variant="outline" className="cursor-pointer rounded-md border border-border/30 bg-secondary text-[11px] font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground">
                {p}
                <ArrowUpRight className="ml-1 h-3 w-3 opacity-70" />
              </Badge>
            </button>
          ))}
        </div>
      ),
    },
  ]

  if (query.isLoading && !query.data) return <TableSkeleton />
  if (query.isError && !query.data) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />

  const result = query.data!

  return (
    <div className="space-y-5">
      <PageHeader
        title="Failure Analysis"
        description="Fallos agrupados por mensaje para detectar patrones repetidos y acceder rapido a los productos afectados."
      />
      <div className="rounded-md border border-border/25 bg-card px-4 py-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Min. ocurrencias</label>
            <Input
              type="number"
              min={1}
              value={minOccurrences}
              onChange={(e) => {
                setMinOccurrences(Number(e.target.value) || 1)
                pagination.resetPage()
              }}
              className="h-10 w-32 rounded-md border-border/40 bg-card shadow-none"
            />
          </div>
          <Input
            type="text"
            placeholder="Filtrar por producto..."
            value={product}
            onChange={(e) => {
              setProduct(e.target.value)
              pagination.resetPage()
            }}
            className="h-10 w-48 rounded-md border-border/40 bg-card shadow-none"
          />
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              pagination.resetPage()
            }}
            placeholder="Buscar mensajes de error..."
            className="max-w-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {product ? (
            <>
              <span>Filtro activo:</span>
              <Badge variant="secondary" className="rounded-md border border-border/30 bg-secondary text-muted-foreground">
                {product}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-md px-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => {
                  setProduct('')
                  pagination.resetPage()
                }}
              >
                Limpiar filtro
              </Button>
            </>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Pasa el cursor sobre el mensaje o el conteo de tests para ver mas detalle, y usa los badges para ir al producto afectado.
        </p>
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
