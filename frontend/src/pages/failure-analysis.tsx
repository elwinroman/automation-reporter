import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useVersion } from '@/context/version-context';
import { formatNumber } from '@/lib/format';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorFallback } from '@/components/shared/error-fallback';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePagination } from '@/hooks/use-pagination';

interface FailureRow {
  message: string;
  occurrences: number;
  affectedTests: string[];
  affectedProducts: string[];
}

export default function FailureAnalysis() {
  const { version } = useVersion();
  const [search, setSearch] = useState('');
  const [minOccurrences, setMinOccurrences] = useState(1);
  const [product, setProduct] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const pagination = usePagination({ pageSize: 20 });

  const query = trpc.report.failureAnalysis.useQuery({
    version: version!,
    minOccurrences,
    product: product || undefined,
    search: debouncedSearch || undefined,
    pagination: { limit: pagination.pageSize, offset: pagination.offset },
  });

  const columns: Column<FailureRow>[] = [
    {
      key: 'message',
      header: 'Error Message',
      render: (r) => (
        <Tooltip content={r.message}>
          <span className="truncate max-w-[400px] block text-xs font-mono">
            {r.message.length > 80 ? r.message.slice(0, 80) + '...' : r.message}
          </span>
        </Tooltip>
      ),
    },
    { key: 'occurrences', header: 'Occurrences', className: 'text-right', render: (r) => <span className="text-red-600 font-medium">{formatNumber(r.occurrences)}</span> },
    {
      key: 'affectedTests', header: 'Affected Tests', className: 'text-right',
      render: (r) => (
        <Tooltip content={<div className="space-y-1">{r.affectedTests.slice(0, 10).map((t) => <div key={t} className="text-xs">{t}</div>)}{r.affectedTests.length > 10 && <div className="text-xs">...and {r.affectedTests.length - 10} more</div>}</div>}>
          <Badge variant="secondary">{r.affectedTests.length}</Badge>
        </Tooltip>
      ),
    },
    {
      key: 'affectedProducts', header: 'Affected Products',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.affectedProducts.slice(0, 3).map((p) => (
            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
          ))}
          {r.affectedProducts.length > 3 && <Badge variant="outline" className="text-xs">+{r.affectedProducts.length - 3}</Badge>}
        </div>
      ),
    },
  ];

  if (query.isLoading) return <TableSkeleton />;
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />;

  const result = query.data!;

  return (
    <div className="space-y-4">
      <PageHeader title="Failure Analysis" description="Failures grouped by error message" />
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Min Occurrences</label>
          <Input type="number" min={1} value={minOccurrences} onChange={(e) => { setMinOccurrences(Number(e.target.value) || 1); pagination.resetPage(); }} className="w-32" />
        </div>
        <Input
          type="text"
          placeholder="Filter by product..."
          value={product}
          onChange={(e) => { setProduct(e.target.value); pagination.resetPage(); }}
          className="w-48"
        />
        <SearchInput value={search} onChange={(v) => { setSearch(v); pagination.resetPage(); }} placeholder="Search error messages..." className="max-w-sm" />
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
  );
}
