import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PassRateBadge } from '@/components/shared/pass-rate-badge'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
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

const compactHeaderClassName = 'text-[10px] tracking-[0.14em]'
const compactHeaderButtonClassName = 'text-[10px] tracking-[0.12em]'

export default function FlakyTests() {
  const { version } = useVersion()
  const navigate = useNavigate()
  const pagination = usePagination({ pageSize: 20 })
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'passRate',
    direction: 'asc',
  })

  const query = trpc.report.flakyTests.useQuery({
    version: version!,
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
      className: 'text-right',
      headerClassName: compactHeaderClassName,
      render: (r) => r.passCount,
    },
    {
      key: 'failCount',
      header: 'Failed',
      sortable: true,
      className: 'text-right',
      headerClassName: compactHeaderClassName,
      headerButtonClassName: compactHeaderButtonClassName,
      render: (r) => <span className="font-medium text-destructive">{r.failCount}</span>,
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
      key: 'products',
      header: 'Products',
      headerClassName: compactHeaderClassName,
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {[...new Set(r.products)].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => navigate(`/products/${encodeURIComponent(p)}`)}
            >
              <Badge variant="secondary" className="cursor-pointer rounded-md border border-border/30 bg-secondary text-[11px] font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground">
                {p}
                <ArrowUpRight className="ml-1 h-3 w-3 opacity-70" />
              </Badge>
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
    <div className="space-y-5">
      <PageHeader title="Flaky Tests" description="Casos con comportamiento inestable entre ejecuciones, ordenados para identificar ruido y regresiones intermitentes." />
      <div className="rounded-md border border-border/25 bg-card px-4 py-4">
        <p className="text-sm text-muted-foreground">
          Revisa primero los casos con menor tasa de exito y mas fallos acumulados. Los badges de producto te llevan al detalle relacionado.
        </p>
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

