#!/bin/bash
set -euo pipefail

# Genera el archivo de entorno de Docker a partir del .sample sin sobrescribir cambios existentes.

cd "$(dirname "$0")/.."

cp -n .env.docker.sample .env.docker

echo "Archivo generado si no existia:"
echo "  - .env.docker"
echo
echo "Edita al menos estas variables antes de desplegar:"
echo "  - .env.docker -> LOGS_HOST_PATH, BACKEND_PORT, FRONTEND_PORT"
