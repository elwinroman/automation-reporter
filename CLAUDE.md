# automation-reporter

## Alcance

Este proyecto esta orientado especificamente a logs de TestComplete exportados en formato JUnit (`summary.xml`).

Genera reportes consolidados de pruebas de automatizacion para multiples ejecuciones a partir de esos artefactos.

## Skills del Proyecto

Las siguientes skills estan disponibles y se cargan automaticamente:

- **typescript**: Patrones estrictos de TypeScript y mejores practicas
- **nodejs**: Mejores practicas de Node.js
- **react-19**: Patrones y caracteristicas de React 19
- **tailwind-4**: Utilidades y configuracion de Tailwind CSS 4
- **ai-sdk-5**: Vercel AI SDK 5, streaming, herramientas y APIs
- **playwright**: Testing end-to-end con Playwright

## Instrucciones Generales

- Seguir arquitectura limpia (Hexagonal / Ports & Adapters)
- TypeScript strict mode, ESM con extensiones `.js` en imports
- Usar pnpm como package manager
- Mantener separacion clara entre capas: Domain, Application, Infrastructure
- Patron de DI manual (`deps` object)

## Estructura del Proyecto

```text
backend/
|-- src/
|   |-- domain/          # Entidades y logica de negocio
|   |-- application/     # Casos de uso
|   `-- infrastructure/  # Implementaciones concretas (CLI, tRPC, filesystem)
`-- package.json

frontend/                # Aplicacion React con cliente tRPC
```

## Comandos

- `cd backend && pnpm build`: Compilar backend
- `cd backend && pnpm dev`: Ejecutar backend en modo desarrollo
- `cd backend && pnpm dev:server`: Iniciar servidor tRPC (puerto 3000)
- `cd frontend && pnpm dev`: Iniciar frontend de desarrollo (puerto 5173)
