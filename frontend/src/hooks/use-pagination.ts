import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  pageSize?: number;
}

export function usePagination({ pageSize = 20 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(0);

  const offset = useMemo(() => page * pageSize, [page, pageSize]);

  const goToPage = useCallback((p: number) => setPage(p), []);
  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const resetPage = useCallback(() => setPage(0), []);

  return {
    page,
    pageSize,
    offset,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
  };
}
