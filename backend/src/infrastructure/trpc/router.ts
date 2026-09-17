import { router } from './trpc.js'
import {
  generate,
  globalSummary,
  categories,
  products,
  testCases,
  productDetail,
  flakyTests,
  slowestTests,
  slowestProducts,
  failureAnalysis,
  sources,
} from './procedures/index.js'

/** Router principal de la aplicacion. Todos los procedimientos bajo `report.*`. */
export const appRouter = router({
  report: router({
    generate,
    globalSummary,
    categories,
    products,
    testCases,
    productDetail,
    flakyTests,
    slowestTests,
    slowestProducts,
    failureAnalysis,
    sources,
  }),
})

/** Tipo del router para importar en el frontend con `@trpc/client`. */
export type AppRouter = typeof appRouter;
