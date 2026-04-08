import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-border/80 bg-card/65 px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-border/70">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
