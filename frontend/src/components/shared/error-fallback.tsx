import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorFallback({ message, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-border/70 bg-card/85 px-6 py-12 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/15">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">Something went wrong</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {message ?? 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5 rounded-full border-border/70 bg-background/80 px-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
