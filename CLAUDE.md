# automation-reporter

Este proyecto genera reportes consolidados de pruebas de automatización para múltiples productos.

## Skills del Proyecto

Las siguientes skills están disponibles y se cargan automáticamente:

- **typescript**: Patrones estrictos de TypeScript y mejores prácticas
- **nodejs**: Mejores prácticas de Node.js
- **react-19**: Patrones y características de React 19
- **tailwind-4**: Utilidades y configuración de Tailwind CSS 4
- **ai-sdk-5**: Vercel AI SDK 5 - streaming, herramientas, APIs
- **playwright**: Testing end-to-end con Playwright

## Instrucciones Generales

- Seguir arquitectura limpia (Hexagonal/Ports & Adapters)
- TypeScript strict mode, ESM con extensiones `.js` en imports
- Usar pnpm como package manager
- Mantener separación clara entre capas: Domain, Application, Infrastructure
- Patrón de DI manual (deps object)

## Estructura del Proyecto

```
src/
├── domain/          # Entidades y lógica de negocio
├── application/     # Casos de uso
├── infrastructure/  # Implementaciones concretas (CLI, tRPC, filesystem)
└── shared/          # Utilidades compartidas

frontend/            # Aplicación React con tRPC client
```

## Comandos

- `pnpm build`: Compilar el proyecto
- `pnpm dev`: Ejecutar en modo desarrollo
- `pnpm serve`: Iniciar servidor tRPC (puerto 3000)
- `pnpm frontend:dev`: Iniciar frontend de desarrollo (puerto 5173)
