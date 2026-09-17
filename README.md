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
pnpm dev:cli generate

# O pasar directorio explicitamente
pnpm dev:cli generate ./otra/ruta/logs

# Con ruta de salida personalizada
pnpm dev:cli generate -o ./output/mi-reporte.json

# Produccion
pnpm build
pnpm start:cli generate
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
pnpm start:server:network
```

Usa `--host 0.0.0.0` o `pnpm start:server:network` cuando necesites que otras maquinas de la red puedan acceder al backend.

El flujo es:

1. `report.sources`: lista el arbol de carpetas y fuentes disponibles en `LOGS_DIRECTORY`.
2. `report.generate`: parsea los XML de una fuente marcada y cachea el resultado en memoria.
3. `report.*`: consulta, filtra, pagina y ordena sobre el reporte cacheado.

### Servidor local de reportes HTML

En produccion, nginx publica las paginas HTML de TestComplete. Para desarrollo, el proyecto incluye una simulacion con el servidor HTTP estandar de Python; no es necesario instalar nginx ni dependencias de Python adicionales.

Con `LOGS_DIRECTORY` configurado en `backend/.env`, inicia el servidor desde la raiz del repositorio:

```bash
pnpm --dir frontend nginx-pages:start
```

El comando crea `.venv` automaticamente si no existe y publica la raiz de logs en `http://127.0.0.1:8082`.

Configura el frontend para generar los enlaces hacia ese servidor:

```env
VITE_REPORTS_BASE_URL=http://127.0.0.1:8082
```

Reinicia `pnpm --dir frontend dev` despues de cambiar la variable. Para detener la simulacion:

```bash
pnpm --dir frontend nginx-pages:stop
```

Si necesitas servir otra carpeta de logs temporalmente, usa el script tecnico:

```bash
python scripts/dev/serve_nginx_pages.py --root "D:\ruta\a\logs" --port 8082
```

La carpeta servida debe ser la raiz que contiene las versiones de reportes, no una version individual. Consulta [la guia completa](docs/reports-dev-server.md) para mas detalles.

## API tRPC

Todos los endpoints estan bajo el namespace `report.*`.

### Fuentes

| Endpoint | Input | Output |
|---|---|---|
| `report.sources` | - | `Array<{ path: string, name: string, kind: 'folder' \| 'source', children: Nodo[], cached: boolean, generatedAt: string \| null }>` |

Una carpeta es una fuente seleccionable (`kind: 'source'`) solo cuando contiene directamente el archivo `.automation-reporter-marker`. Las demas son carpetas navegables (`kind: 'folder'`). `path` es el id canonico relativo a `LOGS_DIRECTORY`.

### Mutation

| Endpoint | Input | Descripcion |
|---|---|---|
| `report.generate` | `{ version: string }` | Genera el reporte de una fuente marcada y retorna `{ version, success, generatedAt, summary }` |

Validaciones:
- `version` es el id canonico de la fuente relativo a `LOGS_DIRECTORY`; admite subcarpetas, por ejemplo `Creditos/Preproduccion`
- se rechazan rutas absolutas, `..`, `\` y segmentos vacios
- la carpeta debe contener el marcador `.automation-reporter-marker`

### Queries

Todas las queries requieren `version: string` y retornan `PRECONDITION_FAILED` si esa version no ha sido generada previamente.

| Endpoint | Parametros principales |
|---|---|
| `report.globalSummary` | `dateRange?: { from?, to? }` |
| `report.categories` | `category?`, `sortBy?: { field, direction }` |
| `report.products` | `category?`, `minPassRate?`, `maxPassRate?`, `dateRange?`, `search?`, `pagination?`, `sortBy?` |
| `report.testCases` | `statusType?: 'flaky'\|'always-passing'\|'always-failing'\|'all'`, `product?`, `minPassRate?`, `maxPassRate?`, `search?`, `pagination?`, `sortBy?` |
| `report.productDetail` | `product: string` |
| `report.flakyTests` | `minPassRate?`, `maxPassRate?`, `minExecutions?`, `pagination?`, `sortBy?` |
| `report.slowestTests` | `topN?: number`, `sortBy?: { field, direction }` |
| `report.slowestProducts` | `topN?: number`, `sortBy?: { field, direction }` |
| `report.failureAnalysis` | `search?`, `pagination?` |

### Ejemplos con curl

```bash
# 1. Listar fuentes disponibles
curl http://localhost:3000/report.sources

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

const sources = await trpc.report.sources.query();

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

Nota semantica:

- en la UI actual se usa el termino `Ejecucion` como reemplazo visible de `Producto`
- internamente la logica todavia usa `product` como nombre tecnico y clave de agregacion
- ver [docs/execution-concept.md](./docs/execution-concept.md) para el contexto y el posible refactor futuro

### Iniciar frontend

```bash
# Terminal 1
cd backend && pnpm dev:server

# Terminal 2
cd frontend && pnpm dev
```

Disponible en `http://localhost:5173`.

Para probar desde otra maquina en la red:

```bash
# Terminal 1
cd backend && pnpm dev:server:network

# Terminal 2
cd frontend && pnpm dev:network
```

### Caracteristicas

- Selector de version
- Dashboard con metricas principales
- Exploracion de categorias, ejecuciones y test cases
- Analisis de flaky tests, pruebas lentas y fallos
- Integracion type-safe con tRPC

## Scripts

| Script | Descripcion |
|---|---|
| `cd backend && pnpm dev:cli` | Ejecuta el CLI en modo desarrollo |
| `cd backend && pnpm dev:server` | Inicia servidor tRPC en desarrollo |
| `cd backend && pnpm dev:server:network` | Inicia servidor tRPC escuchando en la red local |
| `cd frontend && pnpm dev` | Inicia frontend en desarrollo |
| `cd frontend && pnpm dev:network` | Inicia frontend Vite escuchando en la red local |
| `cd backend && pnpm build` | Compila TypeScript backend a `backend/dist/` |
| `cd backend && pnpm start:cli` | Ejecuta el CLI compilado |
| `cd backend && pnpm start:server` | Inicia servidor tRPC compilado |
| `cd backend && pnpm start:server:network` | Inicia servidor tRPC compilado escuchando en la red local |
| `cd frontend && pnpm preview` | Sirve el frontend compilado solo en localhost |
| `cd frontend && pnpm preview:network` | Sirve el frontend compilado escuchando en la red local |

## Docker

Se incluye una orquestacion base con Docker Compose para desplegar frontend y backend juntos.

### Archivos

- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `.env.docker.sample`

### Configuracion

1. Crear un archivo `.env` en la raiz a partir de `.env.docker.sample`.
2. Ajustar `LOGS_HOST_PATH` para apuntar a la carpeta real de logs en tu maquina o servidor.

Variables principales:

| Variable | Descripcion | Default |
|---|---|---|
| `BACKEND_PORT` | Puerto externo del backend | `3000` |
| `FRONTEND_PORT` | Puerto externo del frontend | `8080` |
| `LOGS_HOST_PATH` | Carpeta de logs montada desde el host | `./logs` |
| `BACKEND_LOGS_DIRECTORY` | Ruta interna usada por el backend dentro del contenedor | `/data/logs` |
| `VITE_TRPC_URL` | URL base usada por el frontend para tRPC | `/` |
| `VITE_REPORTS_BASE_URL` | Base URL publica de los reportes HTML servidos por un nginx externo | `http://localhost:9001` |

### Levantar servicios

```bash
docker compose --env-file .env up --build -d
```

Antes de levantar:

- ajusta `VITE_REPORTS_BASE_URL` con la URL publica real donde tu nginx del servidor publica los reportes HTML
- si el frontend sera consumido desde otras maquinas, evita `localhost` y usa el host o IP reales del servidor en esa variable

### Script de setup

Se incluyen scripts bash simples para preparar entorno y desplegar con Docker Compose:

```bash
bash setup/00_generate_environment.sh
```

Esto genera, si no existen:

- `.env.docker`

Luego editar los valores necesarios y desplegar:

```bash
bash setup/01_build_and_deploy.sh
```

Con override de version:

```bash
bash setup/01_build_and_deploy.sh 2.1.0
```

### Detener servicios

```bash
docker compose --env-file .env down
```

### Acceso

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`

En esta configuracion:

- nginx sirve la SPA del frontend
- nginx proxya las rutas `report.*` al backend
- el backend lee los logs desde `LOGS_HOST_PATH` mediante un mount read-only
- los reportes HTML se sirven fuera del stack, desde un nginx externo configurado en `VITE_REPORTS_BASE_URL`

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
