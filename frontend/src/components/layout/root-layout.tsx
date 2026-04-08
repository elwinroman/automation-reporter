import { Outlet } from 'react-router'
import { SidebarClassic } from './sidebar-classic'
import { Header } from './header'

export function RootLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarClassic />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pl-64">
        <Header />
        <main className="flex-1 overflow-auto bg-background px-6 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
