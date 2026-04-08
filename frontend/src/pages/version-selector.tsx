import { useNavigate } from 'react-router'
import { Database, Loader2, Play, CheckCircle, RefreshCw } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Skeleton } from '@/components/ui/skeleton'

export default function VersionSelector() {
  const navigate = useNavigate()
  const { setVersion } = useVersion()
  const versions = trpc.report.versions.useQuery()
  const generate = trpc.report.generate.useMutation({
    onSuccess: (_data, variables) => {
      versions.refetch()
      setVersion(variables.version)
      navigate('/dashboard')
    },
  })

  function handleSelect(name: string) {
    setVersion(name)
    navigate('/dashboard')
  }

  function handleGenerate(e: React.MouseEvent, name: string) {
    e.stopPropagation()
    generate.mutate({ version: name })
  }

  if (versions.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-4xl px-6">
          <div className="mb-8 text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (versions.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ErrorFallback
          message="Could not connect to the backend. Make sure the server is running."
          onRetry={() => versions.refetch()}
        />
      </div>
    )
  }

  const data = versions.data ?? []

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-4xl px-6">
        <div className="mb-8 text-center">
          <Database className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h1 className="text-3xl font-bold tracking-tight">Automation Reporter</h1>
          <p className="text-muted-foreground mt-1">
            Selecciona una versión para ver el reporte de pruebas
          </p>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Versiones no encontradas. Asegurate que LOGS_DIRECTORY esté configurado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((v) => {
              const isPending = generate.isPending && generate.variables?.version === v.name
              return (
                <Card
                  key={v.name}
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => !generate.isPending && v.cached && handleSelect(v.name)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {v.cached && <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" />}
                      <span className="truncate">{v.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">
                        {v.cached
                          ? `Generado ${v.generatedAt ? new Date(v.generatedAt).toLocaleString() : ''}`
                          : 'No generado'}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {v.cached && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={generate.isPending}
                            title="Regenerate"
                            onClick={(e) => handleGenerate(e, v.name)}
                          >
                            {isPending
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <RefreshCw className="h-4 w-4" />
                            }
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={v.cached ? 'secondary' : 'default'}
                          disabled={generate.isPending}
                          onClick={(e) => {
                            if (v.cached) {
                              e.stopPropagation()
                              handleSelect(v.name)
                            } else {
                              handleGenerate(e, v.name)
                            }
                          }}
                        >
                          {!v.cached && isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : v.cached ? (
                            'Ver'
                          ) : (
                            <>
                              <Play className="h-3 w-3" />
                              Generar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
