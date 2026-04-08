import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DataTablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({ total, page, pageSize, onPageChange }: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 0
  const canNext = page < totalPages - 1

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border/25 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total} resultado{total !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Página {page + 1} de {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-md border-border/30 bg-secondary shadow-none" disabled={!canPrev} onClick={() => onPageChange(0)}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-md border-border/30 bg-secondary shadow-none" disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-md border-border/30 bg-secondary shadow-none" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-md border-border/30 bg-secondary shadow-none" disabled={!canNext} onClick={() => onPageChange(totalPages - 1)}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
