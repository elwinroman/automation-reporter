# automation-reporter

## Alcance

Este proyecto esta orientado especificamente a procesar logs de TestComplete exportados en formato JUnit (`summary.xml`).

La fuente de datos esperada en toda la aplicacion son ejecuciones de TestComplete exportadas como `summary.xml` o como reportes HTML legacy con `_root.js`.

Sistema completo para generar y visualizar reportes estadisticos de pruebas de automatizacion a partir de logs de TestComplete en formato JUnit.

**Incluye**:
- CLI para generacion de reportes
- Servidor tRPC con soporte multi-version
- Frontend web React con visualizaciones interactivas

## Requisitos

- Node.js >= 18
- pnpm

## Instalacion

```bash
cd backend && pnpm install
cd ../frontend && pnpm install
cd ../backend && cp .env.sample .env
```

## Configuracion

`LOGS_DIRECTORY` debe apuntar a una carpeta que contenga logs de TestComplete organizados por version.

Crear un archivo `backend/.env`, o copiar `backend/.env.sample`:

```env
LOGS_DIRECTORY=./logs
```

| Variable | Requerida | Descripcion |
|---|---|---|
| `LOGS_DIRECTORY` | Si | Ruta al directorio raiz que contiene los logs de TestComplete |

Las variables se validan al iniciar con Zod en `backend/src/core/environment.ts`. Si falta alguna, el proceso termina con un mensaje de error claro.

## Uso

### CLI: Generar reporte JSON

La entrada esperada por el CLI son archivos `summary.xml` o reportes HTML legacy (`_root.js`, `_TestLog.js`) generados por TestComplete.

```bash
# Usa LOGS_DIRECTORY del .env
cd backend
pnpm dev generate

# O pasar directorio explicitamente
pnpm dev generate ./otra/ruta/logs

# Con ruta de salida personalizada
pnpm dev generate -o ./output/mi-reporte.json

# Produccion
pnpm build
pnpm start generate
```

Esto busca recursivamente archivos `summary.xml` en el directorio indicado y genera un JSON con el reporte agregado.

### Servidor tRPC

El servidor expone reportes construidos especificamente a partir de logs de TestComplete ya parseados.

```bash
# Desarrollo
cd backend
pnpm dev:server
pnpm dev:server -- --port 4000 --host 0.0.0.0

# Produccion
pnpm build
pnpm start:server
```

El flujo es:

1. `report.versions`: lista las versiones disponibles en `LOGS_DIRECTORY`.
2. `report.generate`: parsea los XML de una version especifica y cachea el resultado en memoria.
3. `report.*`: consulta, filtra, pagina y ordena sobre el reporte cacheado.

## API tRPC

Todos los endpoints estan bajo el namespace `report.*`.

### Versiones

| Endpoint | Input | Output |
|---|---|---|
| `report.versions` | - | `Array<{ name: string, cached: boolean, generatedAt: string \| null }>` |

### Mutation

| Endpoint | Input | Descripcion |
|---|---|---|
| `report.generate` | `{ version: string }` | Genera el reporte desde `LOGS_DIRECTORY/{version}` y retorna `{ version, success, generatedAt, summary }` |

Validaciones:
- `version` no puede contener `..`, `/` o `\`

### Queries

Todas las queries requieren `version: string` y retornan `PRECONDITION_FAILED` si esa version no ha sido generada previamente.

| Endpoint | Parametros principales |
|---|---|
| `report.globalSummary` | `dateRange?: { from?, to? }` |
| `report.categories` | `category?`, `sortBy?: { field, direction }` |
| `report.products` | `category?`, `minPassRate?`, `maxPassRate?`, `dateRange?`, `search?`, `pagination?`, `sortBy?` |
| `report.testCases` | `statusType?: 'flaky'\|'always-passing'\|'always-failing'\|'all'`, `product?`, `minPassRate?`, `maxPassRate?`, `search?`, `pagination?`, `sortBy?` |
| `report.executions` | `category?`, `product?`, `dateRange?`, `pagination?`, `sortBy?` |
| `report.productDetail` | `product: string` |
| `report.flakyTests` | `minPassRate?`, `maxPassRate?`, `minExecutions?`, `pagination?`, `sortBy?` |
| `report.slowestTests` | `topN?: number`, `metric?: 'avgTime'\|'maxTime'\|'totalTime'` |
| `report.failureAnalysis` | `minOccurrences?: number`, `product?`, `search?`, `pagination?` |

### Ejemplos con curl

```bash
# 1. Listar versiones disponibles
curl http://localhost:3000/report.versions

# 2. Generar reporte para una version especifica
curl -X POST http://localhost:3000/report.generate \
  -H "Content-Type: application/json" \
  -d '{"version":"v1.0.0"}'

# 3. Resumen global de una version
curl "http://localhost:3000/report.globalSummary?input=%7B%22version%22%3A%22v1.0.0%22%7D"

# 4. Test cases flaky paginados
curl "http://localhost:3000/report.testCases?input=%7B%22version%22%3A%22v1.0.0%22%2C%22statusType%22%3A%22flaky%22%2C%22pagination%22%3A%7B%22limit%22%3A10%7D%7D"

# 5. Top 5 tests mas lentos por tiempo promedio
curl "http://localhost:3000/report.slowestTests?input=%7B%22version%22%3A%22v1.0.0%22%2C%22topN%22%3A5%7D"

# 6. Analisis de fallos con minimo 2 ocurrencias
curl "http://localhost:3000/report.failureAnalysis?input=%7B%22version%22%3A%22v1.0.0%22%2C%22minOccurrences%22%3A2%7D"
```

### Integracion con frontend

```ts
import type { AppRouter } from '@backend/infrastructure/trpc/router.js';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000' })],
});

const versions = await trpc.report.versions.query();

await trpc.report.generate.mutate({ version: 'v1.0.0' });

const flaky = await trpc.report.flakyTests.query({
  version: 'v1.0.0',
  minExecutions: 3,
});

const summary = await trpc.report.globalSummary.query({
  version: 'v1.0.0',
});
```

## Estructura de carpetas de logs

Esta estructura asume logs generados por TestComplete.

### Estructura multi-version

El `LOGS_DIRECTORY` debe contener subdirectorios, donde cada subdirectorio representa una version de logs de TestComplete:

```text
logs/
|-- v1.0.0/
|   |-- Categoria1_Producto1_20250101_120000/
|   |   `-- summary.xml
|   `-- Categoria2_Producto2_20250101_130000/
|       `-- summary.xml
|-- v1.1.0/
|   `-- ...
`-- release-2025-02/
    `-- ...
```

Cada version se genera independientemente con `report.generate({ version: "v1.0.0" })` y se cachea en memoria por separado.

### Extraccion de metadata

Dentro de cada version, el CLI busca recursivamente todos los `summary.xml` de TestComplete, sin importar la estructura de carpetas. La metadata se extrae asi:

1. `_root.js` como fuente primaria, si existe junto al `summary.xml`.
2. Nombre de carpeta como fallback con el patron `Categoria_Producto_YYYYMMDD_HHMMSS`.
3. Valores por defecto si nada matchea.

## Arquitectura

### Backend

```text
backend/
  src/
    core/
    domain/
    application/
    infrastructure/
      adapters/
      cli/
      trpc/
```

Las capas `domain` y `application` no dependen de `infrastructure`.

### Frontend

```text
frontend/
  src/
    components/
    pages/
    lib/
    context/
```

El frontend se comunica con el backend exclusivamente via tRPC con type-safety completo.

## Frontend Web

Aplicacion React para visualizar los reportes de forma interactiva.

### Iniciar frontend

```bash
# Terminal 1
cd backend && pnpm dev:server

# Terminal 2
cd frontend && pnpm dev
```

Disponible en `http://localhost:5173`.

### Caracteristicas

- Selector de version
- Dashboard con metricas principales
- Exploracion de categorias, productos y test cases
- Analisis de flaky tests, pruebas lentas y fallos
- Integracion type-safe con tRPC

## Scripts

| Script | Descripcion |
|---|---|
| `cd backend && pnpm dev` | Ejecuta CLI en modo desarrollo |
| `cd backend && pnpm dev:server` | Inicia servidor tRPC en desarrollo |
| `cd frontend && pnpm dev` | Inicia frontend en desarrollo |
| `cd backend && pnpm build` | Compila TypeScript backend a `backend/dist/` |
| `cd backend && pnpm start` | Ejecuta CLI compilado |
| `cd backend && pnpm start:server` | Inicia servidor tRPC compilado |

## Tech stack

### Backend

- TypeScript
- Commander.js
- fast-xml-parser
- @trpc/server v11
- Zod v4
- dotenv

### Frontend

- React 19
- TypeScript
- Vite
- @trpc/react-query v11
- @tanstack/react-query v5
- TailwindCSS 3
- Recharts
- React Router
