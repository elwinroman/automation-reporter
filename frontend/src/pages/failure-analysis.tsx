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
  const debouncedSearch = useDebouncedValue(search)
  const pagination = usePagination({ pageSize: 20 })

  const query = trpc.report.failureAnalysis.useQuery(
    {
      version: version!,
      minOccurrences: 1,
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
        <Badge variant="secondary" className="rounded-md border border-border/30 bg-secondary text-[11px] font-medium text-muted-foreground">
          {r.affectedTests.length}
        </Badge>
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
        title="Análisis de fallos"
        description="Fallos agrupados por mensaje para detectar patrones repetidos y acceder rapido a los productos afectados."
      />
      <div className="rounded-md border border-border/25 bg-card px-4 py-4">
        <div className="flex flex-wrap items-end gap-3">
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
        <p className="mt-3 text-sm text-muted-foreground">
          Usa los badges para ir al producto afectado.
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
