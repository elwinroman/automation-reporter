import { useLocation } from 'react-router'
import { Moon, Sun } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/theme-context'
import { useVersion } from '@/context/version-context'

const routeNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Ejecuciones',
  '/test-cases': 'Test Cases',
  '/flaky-tests': 'Flaky Tests',
  '/slowest-tests': 'Pruebas más lentas',
  '/failure-analysis': 'Análisis de fallos',
}

export function Header() {
  const { version } = useVersion()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const pathBase = '/' + (location.pathname.split('/').filter(Boolean)[0] ?? '')
  const title = routeNames[pathBase] ?? 'Detail'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/45 bg-background/92 px-8 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-extrabold tracking-tight text-white">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        {version && (
          <Badge variant="secondary" className="rounded-md border border-border/40 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {version}
          </Badge>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}
