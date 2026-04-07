import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { trpc, trpcClient } from '@/lib/trpc'
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
        <VersionProvider>
          <RouterProvider router={router} />
        </VersionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

export default App
