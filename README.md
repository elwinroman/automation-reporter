# automation-reporter

Sistema completo para generar y visualizar reportes estadísticos de pruebas de automatización a partir de logs JUnit (`summary.xml`).

**Incluye**:
- CLI para generación de reportes
- Servidor tRPC con soporte multi-versión
- Frontend web React con visualizaciones interactivas

## Requisitos

- Node.js >= 18
- pnpm

## Instalacion

```bash
pnpm install
cp .env.sample .env  # configurar variables de entorno
```

## Configuracion

Crear un archivo `.env` en la raiz (o copiar `.env.sample`):

```env
LOGS_DIRECTORY=./logs
```

| Variable | Requerida | Descripcion |
|---|---|---|
| `LOGS_DIRECTORY` | Si | Ruta al directorio raiz que contiene los logs de automatizacion |

Las variables se validan al iniciar con Zod (`src/core/environment.ts`). Si falta alguna, el proceso termina con un mensaje de error claro.

## Uso

### CLI: Generar reporte JSON

```bash
# Usa LOGS_DIRECTORY del .env
pnpm dev generate

# O pasar directorio explicitamente (override del .env)
pnpm dev generate ./otra/ruta/logs

# Con ruta de salida personalizada
pnpm dev generate -o ./output/mi-reporte.json

# Produccion
pnpm build
pnpm start generate
```

Esto busca recursivamente archivos `summary.xml` en el directorio indicado y genera un JSON con el reporte agregado.

### Servidor tRPC

```bash
# Desarrollo
pnpm dev:server              # puerto 3000 por defecto
pnpm dev:server -- --port 4000 --host 0.0.0.0

# Produccion
pnpm build
pnpm start:server
```

El servidor expone los datos via HTTP con soporte multi-versión. El flujo es:

1. **Listar versiones** (query) — obtiene las versiones disponibles (subdirectorios de `LOGS_DIRECTORY`) con su estado de caché
2. **Generar reporte** (mutation) — parsea los XML de una versión específica y cachea el resultado en memoria
3. **Consultar datos** (queries) — filtra, pagina y ordena sobre el reporte cacheado de una versión

## API tRPC

Todos los endpoints estan bajo el namespace `report.*`.

### Versiones

| Endpoint | Input | Output |
|---|---|---|
| `report.versions` | — | `Array<{ name: string, cached: boolean, generatedAt: string \| null }>` |

Lista las versiones disponibles (subdirectorios de `LOGS_DIRECTORY`) con su estado de caché.

### Mutation

| Endpoint | Input | Descripcion |
|---|---|---|
| `report.generate` | `{ version: string }` | Genera reporte desde `LOGS_DIRECTORY/{version}`. Retorna `{ version, success, generatedAt, summary }` |

**Validaciones**:
- `version` no puede contener `..`, `/` o `\` (protección contra path traversal)

### Queries

**IMPORTANTE**: Todas las queries requieren el parámetro `version: string` y retornan `PRECONDITION_FAILED` si esa versión no ha sido generada previamente.

| Endpoint | Parametros principales (además de `version`) |
|---|---|
| `report.globalSummary` | `dateRange?: { from?, to? }` |
| `report.categories` | `category?`, `sortBy?: { field, direction }` |
| `report.products` | `category?`, `minPassRate?`, `maxPassRate?`, `dateRange?`, `search?`, `pagination?`, `sortBy?` |
| `report.testCases` | `statusType?: 'flaky'\|'always-passing'\|'always-failing'\|'all'`, `product?`, `minPassRate?`, `maxPassRate?`, `search?`, `pagination?`, `sortBy?` |
| `report.executions` | `category?`, `product?`, `dateRange?`, `pagination?`, `sortBy?` |
| `report.productDetail` | `product: string` (requerido) — retorna producto + test cases relacionados |
| `report.flakyTests` | `minPassRate?`, `maxPassRate?`, `minExecutions?`, `pagination?`, `sortBy?` |
| `report.slowestTests` | `topN?: number` (default 10, max 100), `metric?: 'avgTime'\|'maxTime'\|'totalTime'` |
| `report.failureAnalysis` | `minOccurrences?: number`, `product?`, `search?`, `pagination?` |

### Ejemplos con curl

```bash
# 1. Listar versiones disponibles
curl http://localhost:3000/report.versions

# 2. Generar reporte para una versión específica
curl -X POST http://localhost:3000/report.generate \
  -H "Content-Type: application/json" \
  -d '{"version":"v1.0.0"}'

# 3. Resumen global de una versión
curl "http://localhost:3000/report.globalSummary?input=%7B%22version%22%3A%22v1.0.0%22%7D"

# 4. Test cases flaky, paginados (versión v1.0.0)
curl "http://localhost:3000/report.testCases?input=%7B%22version%22%3A%22v1.0.0%22%2C%22statusType%22%3A%22flaky%22%2C%22pagination%22%3A%7B%22limit%22%3A10%7D%7D"

# 5. Top 5 tests mas lentos por tiempo promedio (versión v1.0.0)
curl "http://localhost:3000/report.slowestTests?input=%7B%22version%22%3A%22v1.0.0%22%2C%22topN%22%3A5%7D"

# 6. Analisis de fallos con minimo 2 ocurrencias (versión v1.0.0)
curl "http://localhost:3000/report.failureAnalysis?input=%7B%22version%22%3A%22v1.0.0%22%2C%22minOccurrences%22%3A2%7D"
```

### Integracion con frontend (type-safe)

```typescript
import type { AppRouter } from 'automation-reporter/infrastructure/trpc';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000' })],
});

// Listar versiones disponibles
const versions = await trpc.report.versions.query();

// Generar reporte para una versión
await trpc.report.generate.mutate({ version: 'v1.0.0' });

// Autocomplete completo en todas las queries (todas requieren version)
const flaky = await trpc.report.flakyTests.query({
  version: 'v1.0.0',
  minExecutions: 3
});

const summary = await trpc.report.globalSummary.query({
  version: 'v1.0.0'
});
```

## Estructura de carpetas de logs

### Estructura multi-versión

El `LOGS_DIRECTORY` debe contener subdirectorios, donde cada subdirectorio representa una **versión** de logs:

```
logs/
├── v1.0.0/              # Versión 1.0.0
│   ├── Categoria1_Producto1_20250101_120000/
│   │   └── summary.xml
│   └── Categoria2_Producto2_20250101_130000/
│       └── summary.xml
├── v1.1.0/              # Versión 1.1.0
│   └── ...
└── release-2025-02/     # Otra versión
    └── ...
```

Cada versión se genera independientemente con `report.generate({ version: "v1.0.0" })` y se cachea en memoria por separado.

### Extracción de metadata

Dentro de cada versión, el CLI busca recursivamente todos los `summary.xml`, sin importar la estructura de carpetas. La metadata (categoria, producto, fecha) se extrae asi:

1. **`_root.js`** (fuente primaria) — si existe junto al `summary.xml`, se parsea `info.name` (ej: `"AutomationCorebank: Creditos\\Otorgamiento\\RuralFacilito"`) y `info.startTime` (timestamp ms).
2. **Nombre de carpeta** (fallback) — si no hay `_root.js`, se intenta matchear el patron `Categoria_Producto_YYYYMMDD_HHMMSS`.
3. **Valores por defecto** — si nada matchea: category/product = `"Unknown"`, fecha = now.

## Arquitectura

### Backend (Clean Architecture / Hexagonal)

```
src/
  core/                # Configuracion transversal (environment.ts)
  domain/              # Entidades, value objects, ports (interfaces)
  application/         # Utils y use cases (logica de negocio)
  infrastructure/
    adapters/          # Implementaciones: XML parser, file locator, JSON exporter
    cli/               # Comandos Commander.js (generate, serve)
    trpc/              # Servidor tRPC: router, procedures, schemas
```

Las capas domain y application no dependen de infrastructure.

### Frontend (React + tRPC)

```
frontend/
  src/
    components/        # Componentes reutilizables (shadcn/ui estilo)
    pages/            # 10 páginas/vistas de la aplicación
    lib/              # Utilidades (tRPC client, helpers)
    context/          # VersionContext (estado global de versión)
```

El frontend se comunica con el backend exclusivamente via tRPC con type-safety completo.

## Frontend Web

Aplicación React para visualizar los reportes de forma interactiva.

### Iniciar frontend

```bash
# Terminal 1: Iniciar servidor tRPC backend
pnpm dev:server

# Terminal 2: Iniciar frontend en desarrollo
pnpm --dir frontend dev
```

El frontend estará disponible en http://localhost:5173

### Características

- **Selector de versión**: Página inicial para elegir qué versión visualizar
- **Dashboard**: Resumen global con métricas principales
- **Exploración de datos**: Categorías, productos, test cases, ejecuciones
- **Análisis avanzado**: Tests flaky, tests lentos, análisis de fallos
- **Type-safe**: Integración completa con tRPC para autocomplete de tipos

### Estructura

```
frontend/
├── src/
│   ├── components/       # Componentes React reutilizables
│   ├── pages/           # Páginas de la aplicación (10 rutas)
│   ├── lib/             # Utilidades y configuración tRPC
│   └── context/         # VersionContext para manejo de versión global
└── public/              # Assets estáticos
```

## Scripts

| Script | Descripcion |
|---|---|
| `pnpm dev` | Ejecuta CLI en modo desarrollo (tsx) |
| `pnpm dev:server` | Inicia servidor tRPC en modo desarrollo (puerto 3000) |
| `pnpm --dir frontend dev` | Inicia frontend en modo desarrollo (puerto 5173) |
| `pnpm build` | Compila TypeScript backend a `dist/` |
| `pnpm start` | Ejecuta CLI compilado |
| `pnpm start:server` | Inicia servidor tRPC compilado |

## Tech stack

### Backend

- **TypeScript** (strict, ESM, ES2022)
- **Commander.js** — CLI
- **fast-xml-parser** — parseo JUnit XML
- **@trpc/server** v11 — servidor HTTP con type-safety
- **Zod** v4 — validacion de inputs y variables de entorno
- **dotenv** — carga de `.env`

### Frontend

- **React 19** — UI framework
- **TypeScript** — type safety
- **Vite** — build tool y dev server
- **@trpc/react-query** v11 — cliente tRPC con React Query
- **@tanstack/react-query** v5 — gestión de estado y caché
- **TailwindCSS 3** — estilos y componentes
- **Recharts** — gráficos y visualizaciones
- **React Router** — routing (10 rutas)
