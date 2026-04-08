import type { ReactNode } from 'react'

interface PageHeaderProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-md border border-border/30 bg-secondary px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7">
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">
          Resumen
        </p>
        {title && <h1 className="mt-2 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{title}</h1>}
        {description && (
          <p className={`${title ? 'mt-2' : 'mt-1'} max-w-3xl text-sm leading-6 text-muted-foreground`}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 self-start">{actions}</div>}
    </div>
  )
}
