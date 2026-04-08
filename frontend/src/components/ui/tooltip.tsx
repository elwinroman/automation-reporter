import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [open, setOpen] = React.useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div
          className={cn(
            'absolute z-50 max-w-xs overflow-hidden rounded-md border border-border/30 bg-card px-3 py-2 text-xs text-card-foreground shadow-sm animate-in fade-in-0 zoom-in-95',
            positionClasses[side],
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

export { Tooltip }
