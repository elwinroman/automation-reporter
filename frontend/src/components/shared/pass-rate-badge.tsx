import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatPassRate, passRateColor } from '@/lib/format';

interface PassRateBadgeProps {
  rate: number;
  className?: string;
}

const colorClasses = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  yellow: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
} as const;

export function PassRateBadge({ rate, className }: PassRateBadgeProps) {
  const color = passRateColor(rate);
  return (
    <Badge variant="outline" className={cn(colorClasses[color], className)}>
      {formatPassRate(rate)}
    </Badge>
  );
}
