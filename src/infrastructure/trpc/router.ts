import { router } from './trpc.js';
import {
  versions,
  generate,
  globalSummary,
  categories,
  products,
  testCases,
  executions,
  productDetail,
  flakyTests,
  slowestTests,
  failureAnalysis,
} from './procedures/index.js';

/** Router principal de la aplicacion. Todos los procedimientos bajo `report.*`. */
export const appRouter = router({
  report: router({
    versions,
    generate,
    globalSummary,
    categories,
    products,
    testCases,
    executions,
    productDetail,
    flakyTests,
    slowestTests,
    failureAnalysis,
  }),
});

/** Tipo del router para importar en el frontend con `@trpc/client`. */
export type AppRouter = typeof appRouter;
