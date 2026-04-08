#!/bin/bash
set -euo pipefail

# Rebuild y despliegue del stack con Docker Compose.
# Uso:
#   bash setup/01_build_and_deploy.sh
#   bash setup/01_build_and_deploy.sh 2.1.0

cd "$(dirname "$0")/.."

if [ ! -f .env.docker ]; then
  echo "Falta .env.docker. Ejecuta primero: bash setup/00_generate_environment.sh"
  exit 1
fi

if [ -n "${1:-}" ]; then
  export APP_VERSION="$1"
  echo ">>> Version override: $APP_VERSION"
fi

ENV_FILES="--env-file .env.docker"

echo ">>> Deteniendo backend y frontend..."
docker compose $ENV_FILES stop backend frontend || true
docker compose $ENV_FILES rm -f backend frontend || true

echo ">>> Rebuild y deploy..."
docker compose $ENV_FILES up -d --build
docker image prune -f

if [ -n "${APP_VERSION:-}" ]; then
  DEPLOYED_VERSION="$APP_VERSION"
else
  DEPLOYED_VERSION="$(grep '^APP_VERSION=' .env.docker | cut -d= -f2)"
fi

echo ">>> Deploy completado. Version: ${DEPLOYED_VERSION:-latest}"
docker compose $ENV_FILES ps
