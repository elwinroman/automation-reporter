import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  FolderTree,
  Package,
  TestTubes,
  Play,
  Shuffle,
  Timer,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVersion } from '@/context/version-context'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/categories', label: 'Categorías', icon: FolderTree },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/test-cases', label: 'Test cases', icon: TestTubes },
  { to: '/executions', label: 'Ejecuciones E2E', icon: Play },
  { to: '/flaky-tests', label: 'Flaky Tests', icon: Shuffle },
  { to: '/slowest-tests', label: 'Pruebas mas lentas', icon: Timer },
  { to: '/failure-analysis', label: 'Análisis de fallos', icon: AlertTriangle },
]

export function Sidebar() {
  const { version, clearVersion } = useVersion()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-lg font-semibold">Reporte Automatización</h1>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-3">
        <div className="mb-2 rounded-md bg-muted px-3 py-2">
          <p className="text-xs text-muted-foreground">Version</p>
          <p className="text-sm font-medium truncate">{version}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={clearVersion}
        >
          <ArrowLeft className="h-4 w-4" />
          Change Version
        </Button>
      </div>
    </div>
  )
}
