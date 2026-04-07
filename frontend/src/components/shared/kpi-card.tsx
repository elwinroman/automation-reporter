import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type KpiColor = 'blue' | 'green' | 'red' | 'orange' | 'gray' | 'purple'

interface KpiCardProps {
  title: string;
  value: string;
  color?: KpiColor;
  className?: string;
}

const colorMap: Record<KpiColor, { border: string; text: string }> = {
  blue:   { border: 'border-t-[3px] border-t-blue-500',    text: 'text-blue-600' },
  green:  { border: 'border-t-[3px] border-t-emerald-500', text: 'text-emerald-600' },
  red:    { border: 'border-t-[3px] border-t-red-500',     text: 'text-red-500' },
  orange: { border: 'border-t-[3px] border-t-amber-400',   text: 'text-amber-500' },
  gray:   { border: 'border-t-[3px] border-t-slate-300',   text: 'text-slate-700' },
  purple: { border: 'border-t-[3px] border-t-violet-500',  text: 'text-violet-600' },
}

export function KpiCard({ title, value, color = 'blue', className }: KpiCardProps) {
  const { border, text } = colorMap[color]
  return (
    <Card className={cn(border, 'rounded-lg shadow-sm', className)}>
      <CardContent className="px-4 py-3 flex flex-col items-center justify-center text-center gap-1.5 min-h-[86px]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-tight">
          {title}
        </p>
        <p className={cn('text-2xl font-bold leading-none tabular-nums', text)}>{value}</p>
      </CardContent>
    </Card>
  )
}
