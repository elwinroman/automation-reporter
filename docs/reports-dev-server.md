# Nginx Pages Simulation

Uso de desarrollo para simular la publicacion de paginas HTML que en produccion servira nginx.

## Objetivo

El frontend construye enlaces a reportes HTML usando `VITE_REPORTS_BASE_URL`. En desarrollo no conviene usar `file://` porque el navegador suele bloquearlo. La alternativa es servir la carpeta de logs por HTTP local.

En produccion este rol lo cumple nginx. El script de este documento existe para simular ese comportamiento en desarrollo.

## Script del repositorio

Archivo: `scripts/dev/serve_nginx_pages.py`

El script:

- usa `http.server` de la libreria estandar de Python
- toma `LOGS_DIRECTORY` desde el entorno o desde el `.env` de la raiz
- permite override con `--root`
- por defecto sirve en `http://127.0.0.1:8082`
- simula la base URL desde la que nginx publicaria los reportes HTML

## Preparacion con venv

```bash
python -m venv .venv
```

Activacion en Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Activacion en Windows CMD:

```bat
.venv\Scripts\activate.bat
```

No se instalan dependencias extra. El `venv` se usa para estandarizar el entorno de Python del equipo.

`pnpm --dir frontend nginx-pages:start` crea `.venv` automaticamente cuando no existe.

## Uso recomendado

Desde el frontend, dejando que el manager cree `.venv` si hace falta y use ese Python en segundo plano:

```bash
pnpm --dir frontend nginx-pages:start
```

El estado del proceso se guarda en la carpeta temporal del sistema (`%TEMP%/automation-reporter` en Windows).

## Uso tecnico

Usando una ruta explicita:

```bash
python scripts/dev/serve_nginx_pages.py --root D:\shared\Pruebas --port 8082
```

Ejemplo de salida:

```text
Serving reports from: D:\shared\Pruebas
Base URL: http://127.0.0.1:8082
Usa esta base en frontend/.env como VITE_REPORTS_BASE_URL.
```

## Configuracion del frontend

Crear `frontend/.env`:

```env
VITE_REPORTS_BASE_URL=http://127.0.0.1:8082
```

Luego reiniciar el frontend:

```bash
pnpm --dir frontend dev
```

Para apagar el servidor en segundo plano:

```bash
pnpm --dir frontend nginx-pages:stop
```

Si necesitas reiniciarlo, usa `nginx-pages:stop` y luego `nginx-pages:start`.

## Regla importante de rutas

La base debe apuntar a la carpeta raiz que contiene las versiones, no a una version individual.

Ejemplo correcto:

- raiz servida: `D:\shared\Pruebas`
- version elegida en la app: `PreProduccion353`
- URL base: `http://127.0.0.1:8082`

Si el backend devuelve rutas como `PreProduccion353/Creditos/...`, entonces la URL final resuelve correctamente.

Ejemplo incorrecto:

- raiz servida: `D:\shared\Pruebas\PreProduccion353`
- URL base: `http://127.0.0.1:8081`

Eso duplica el segmento `PreProduccion353` y produce `404`.

## Produccion

En produccion:

- no usar `scripts/dev/serve_nginx_pages.py`
- publicar los reportes HTML con nginx
- configurar `VITE_REPORTS_BASE_URL` con la URL base expuesta por nginx
