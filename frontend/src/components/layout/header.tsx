import { useLocation } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { useVersion } from '@/context/version-context'

const routeNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/test-cases': 'Test Cases',
  '/flaky-tests': 'Flaky Tests',
  '/slowest-tests': 'Slowest Tests',
  '/failure-analysis': 'Failure Analysis',
}

export function Header() {
  const { version } = useVersion()
  const location = useLocation()

  const pathBase = '/' + (location.pathname.split('/').filter(Boolean)[0] ?? '')
  const title = routeNames[pathBase] ?? 'Detail'

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {version && <Badge variant="secondary">{version}</Badge>}
    </header>
  )
}
