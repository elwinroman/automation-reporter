import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { trpc } from '@/lib/trpc';
import { useVersion } from '@/context/version-context';
import { formatNumber } from '@/lib/format';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { PassRateBadge } from '@/components/shared/pass-rate-badge';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorFallback } from '@/components/shared/error-fallback';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePagination } from '@/hooks/use-pagination';

type SortField = 'product' | 'category' | 'executionCount' | 'passRate';

interface ProductRow {
  product: string;
  category: string;
  executionCount: number;
  passRate: number;
}

export default function Products() {
  const { version } = useVersion();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') ?? undefined;
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const pagination = usePagination({ pageSize: 20 });
  const [sort, setSort] = useState<{ field: SortField; direction: 'asc' | 'desc' }>({
    field: 'product',
    direction: 'asc',
  });

  const query = trpc.report.products.useQuery({
    version: version!,
    category: categoryFilter,
    search: debouncedSearch || undefined,
    sortBy: sort,
    pagination: { limit: pagination.pageSize, offset: pagination.offset },
  });

  const handleSort = useCallback((field: string) => {
    setSort((prev) => ({
      field: field as SortField,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    pagination.resetPage();
  }, [pagination]);

  const columns: Column<ProductRow>[] = [
    { key: 'product', header: 'Product', sortable: true, render: (r) => r.product },
    { key: 'category', header: 'Category', sortable: true, render: (r) => r.category },
    { key: 'executionCount', header: 'Executions', sortable: true, className: 'text-right', render: (r) => formatNumber(r.executionCount) },
    { key: 'passRate', header: 'Pass Rate', sortable: true, className: 'text-right', render: (r) => <PassRateBadge rate={r.passRate} /> },
  ];

  if (query.isLoading) return <TableSkeleton />;
  if (query.isError) return <ErrorFallback message={query.error.message} onRetry={() => query.refetch()} />;

  const result = query.data!;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description={categoryFilter ? `Filtered by category: ${categoryFilter}` : 'Test results grouped by product'}
      />
      <SearchInput value={search} onChange={(v) => { setSearch(v); pagination.resetPage(); }} placeholder="Search products..." className="max-w-sm" />
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
  );
}
