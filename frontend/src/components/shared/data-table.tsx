import type { ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DataTablePagination } from './data-table-pagination'

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  headerButtonClassName?: string;
  render: (row: T) => ReactNode;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  sort?: SortState;
  onSort?: (field: string) => void;
  onRowClick?: (row: T) => void;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  sort,
  onSort,
  onRowClick,
  total,
  page,
  pageSize,
  onPageChange,
  className,
}: DataTableProps<T>) {
  function renderSortIcon(key: string) {
    if (!sort || sort.field !== key) return <ArrowUpDown className="ml-1 h-3 w-3" />
    return sort.direction === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="overflow-hidden rounded-md border border-border/25 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/25 bg-secondary hover:bg-secondary">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn('h-12 px-4 text-[11px] font-semibold uppercase tracking-[0.18em]', col.className, col.headerClassName)}
                >
                  {col.sortable && onSort ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        '-ml-3 h-8 rounded-md px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:bg-transparent hover:text-foreground',
                        col.headerButtonClassName,
                      )}
                      onClick={() => onSort(col.key)}
                    >
                      {col.header}
                      {renderSortIcon(col.key)}
                    </Button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 px-4 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={i}
                  className={cn(
                    'border-b border-border/20',
                    onRowClick ? 'cursor-pointer hover:bg-secondary/60' : '',
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn('px-4 py-3.5', col.className)}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {total != null && page != null && pageSize != null && onPageChange && (
        <DataTablePagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
