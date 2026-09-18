import { Link, useNavigate, useParams } from 'react-router'
import { Database, Loader2, Play, CheckCircle, RefreshCw } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useVersion } from '@/context/version-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { MouseEvent } from 'react'
import { ChevronLeft, ChevronRight, Folder } from 'lucide-react'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { TruncatedText } from '@/components/shared/truncated-text'
import { Skeleton } from '@/components/ui/skeleton'

/** Convierte el segmento splat de la URL en nombres de carpeta decodificados. */
function decodeFolderSegments(splat: string | undefined): string[] {
  if (!splat) return []
  return splat
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })
}

/** Construye la URL de una carpeta a partir de su path canonico. */
function folderUrl(path: string): string {
  return `/sources/${path.split('/').map(encodeURIComponent).join('/')}`
}

export default function VersionSelector() {
  const navigate = useNavigate()
  const { setVersion } = useVersion()
  const sources = trpc.report.sources.useQuery()
  const params = useParams()
  const generate = trpc.report.generate.useMutation({
    onSuccess: (_data, variables) => {
      sources.refetch()
      setVersion(variables.version)
      navigate('/dashboard')
    },
  })

  function handleSelect(path: string) {
    setVersion(path)
    navigate('/dashboard')
  }

  function handleGenerate(e: MouseEvent, path: string) {
    e.stopPropagation()
    generate.mutate({ version: path })
  }

  if (sources.isLoading) {
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

  if (sources.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ErrorFallback
          message="Could not connect to the backend. Make sure the server is running."
          onRetry={() => sources.refetch()}
        />
      </div>
    )
  }

  const data = sources.data ?? []
  const folderSegments = decodeFolderSegments(params['*'])
  const breadcrumbs: typeof data = []
  let nodes = data
  let isInvalidPath = false

  for (const segment of folderSegments) {
    const previousPath = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].path : ''
    const currentPath = previousPath ? `${previousPath}/${segment}` : segment
    const folder = nodes.find((node) => node.path === currentPath && node.kind === 'folder')

    if (!folder) {
      isInvalidPath = true
      break
    }

    breadcrumbs.push(folder)
    nodes = folder.children
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-4xl p-8">
        <div className="mb-8 text-center">
          <Database className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h1 className="text-3xl font-bold tracking-tight">Automation Reporter</h1>
          <p className="text-muted-foreground mt-1">
            Selecciona una versión para ver el reporte de pruebas
          </p>
        </div>

        {generate.isError && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            No se pudo generar el reporte: la carpeta seleccionada no contiene logs compatibles TestComplete.
          </div>
        )}

        {!isInvalidPath && (
          <nav aria-label="Navegación de fuentes" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.length > 0 && (
              <Link
                to={breadcrumbs.length > 1 ? folderUrl(breadcrumbs[breadcrumbs.length - 2].path) : '/'}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver
              </Link>
            )}
            <Link to="/" className="rounded-md px-2 py-1.5 hover:text-foreground">
              Fuentes
            </Link>
            {breadcrumbs.map((folder) => (
              <div key={folder.path} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4" />
                <Link to={folderUrl(folder.path)} className="rounded-md px-2 py-1.5 hover:text-foreground">
                  {folder.name}
                </Link>
              </div>
            ))}
          </nav>
        )}

        {isInvalidPath ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              La carpeta indicada no existe o no es una carpeta de fuentes.
            </p>
            <Link to="/" className="mt-3 inline-block text-sm underline hover:text-foreground">
              Volver a Fuentes
            </Link>
          </div>
        ) : nodes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {breadcrumbs.length === 0
                ? 'No se encontraron fuentes. Asegúrate de que LOGS_DIRECTORY esté configurado.'
                : 'Esta carpeta está vacía.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => {
              if (node.kind === 'folder') {
                return (
                  <Card
                    key={node.path}
                    className="hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(folderUrl(node.path))}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <TruncatedText text={node.name} className="min-w-0" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {node.children.length} elementos
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              const isPending = generate.isPending && generate.variables?.version === node.path
              return (
                <Card
                  key={node.path}
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => !generate.isPending && node.cached && handleSelect(node.path)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {node.cached && <CheckCircle className="h-4 w-4 shrink-0 text-[hsl(var(--success))]" />}
                      <TruncatedText text={node.name} className="min-w-0" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">
                        {node.cached
                          ? `Generado ${node.generatedAt ? new Date(node.generatedAt).toLocaleString() : ''}`
                          : 'No generado'}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {node.cached && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={generate.isPending}
                            title="Regenerate"
                            onClick={(e) => handleGenerate(e, node.path)}
                          >
                            {isPending
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <RefreshCw className="h-4 w-4" />
                            }
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={node.cached ? 'secondary' : 'default'}
                          disabled={generate.isPending}
                          onClick={(e) => {
                            if (node.cached) {
                              e.stopPropagation()
                              handleSelect(node.path)
                            } else {
                              handleGenerate(e, node.path)
                            }
                          }}
                        >
                          {!node.cached && isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : node.cached ? (
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
