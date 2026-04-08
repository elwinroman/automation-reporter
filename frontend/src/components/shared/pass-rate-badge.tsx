import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatPassRate, passRateColor } from '@/lib/format'

interface PassRateBadgeProps {
  rate: number;
  className?: string;
}

const colorClasses = {
  green: 'border-[hsl(var(--success)/0.2)] bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]',
  yellow: 'border-[hsl(var(--warning)/0.2)] bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]',
  red: 'border-[hsl(var(--destructive)/0.2)] bg-[hsl(var(--destructive)/0.12)] text-destructive',
} as const

export function PassRateBadge({ rate, className }: PassRateBadgeProps) {
  const color = passRateColor(rate)
  return (
    <Badge variant="outline" className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-[0.04em]', colorClasses[color], className)}>
      {formatPassRate(rate)}
    </Badge>
  )
}
