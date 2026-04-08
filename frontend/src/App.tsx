import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { trpc, trpcClient } from '@/lib/trpc'
import { ThemeProvider } from '@/context/theme-context'
import { VersionProvider } from '@/context/version-context'
import { router } from '@/router'

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <VersionProvider>
            <RouterProvider router={router} />
          </VersionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

export default App
