import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  Package,
  TestTubes,
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
  { to: '/products', label: 'Ejecuciones', icon: Package },
  { to: '/test-cases', label: 'Test cases', icon: TestTubes },
  { to: '/flaky-tests', label: 'Flaky Tests', icon: Shuffle },
  { to: '/slowest-tests', label: 'Pruebas mas lentas', icon: Timer },
  { to: '/failure-analysis', label: 'Analisis de fallos', icon: AlertTriangle },
]

export function SidebarClassic() {
  const { version, clearVersion } = useVersion()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 shrink-0 flex-col gap-2 border-r border-border/50 bg-popover p-4">
      <div className="mb-8 px-4 py-2">
        <h1 className="text-lg font-extrabold tracking-tight text-foreground">Automation Reporter</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">CRACLASA Reporting</p>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-4 py-3 text-sm tracking-normal transition-all duration-200',
                  isActive
                    ? 'rounded-md bg-card text-primary before:absolute before:left-0 before:h-6 before:w-1 before:rounded-r-md before:bg-primary'
                    : 'rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto pt-4">
        <Separator className="mb-3 bg-border/40" />
        <div className="mb-3 rounded-md border border-border/40 bg-card px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Version</p>
          <p className="mt-1 truncate text-sm font-medium text-foreground">{version}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 rounded-md px-4 text-muted-foreground hover:bg-secondary hover:text-foreground"
          onClick={clearVersion}
        >
          <ArrowLeft className="h-4 w-4" />
          Cambiar Version
        </Button>
      </div>
    </aside>
  )
}
