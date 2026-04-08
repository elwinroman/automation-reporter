import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@backend/infrastructure/trpc/router.js'
import { TRPC_URL } from './constants'

export const trpc = createTRPCReact<AppRouter>()

export const trpcClient = trpc.createClient({
  links: [httpBatchLink({ url: TRPC_URL })],
})
