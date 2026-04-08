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
  blue: { border: 'border-t-2 border-t-primary', text: 'text-primary' },
  green: { border: 'border-t-2 border-t-[hsl(var(--success))]', text: 'text-[hsl(var(--success))]' },
  red: { border: 'border-t-2 border-t-destructive', text: 'text-destructive' },
  orange: { border: 'border-t-2 border-t-[hsl(var(--warning))]', text: 'text-[hsl(var(--warning))]' },
  gray: { border: 'border-t-2 border-t-border', text: 'text-foreground' },
  purple: { border: 'border-t-2 border-t-[hsl(var(--chart-5))]', text: 'text-[hsl(var(--chart-5))]' },
}

export function KpiCard({ title, value, color = 'blue', className }: KpiCardProps) {
  const { border, text } = colorMap[color]
  return (
    <Card className={cn(border, 'rounded-md border border-border/25 bg-card shadow-none', className)}>
      <CardContent className="flex min-h-[112px] flex-col items-center justify-center gap-2 px-4 py-5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-tight text-muted-foreground">
          {title}
        </p>
        <p className={cn('whitespace-nowrap text-2xl font-extrabold leading-none tabular-nums', text)}>{value}</p>
      </CardContent>
    </Card>
  )
}
