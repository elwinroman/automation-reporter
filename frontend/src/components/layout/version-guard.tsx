import { Navigate, Outlet } from 'react-router'
import { useVersion } from '@/context/version-context'

export function VersionGuard() {
  const { version } = useVersion()

  if (!version) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
