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

backend_port="$(grep '^BACKEND_PORT=' .env.docker | cut -d= -f2)"
frontend_port="$(grep '^FRONTEND_PORT=' .env.docker | cut -d= -f2)"
backend_port="${backend_port:-3000}"
frontend_port="${frontend_port:-8080}"

find_port_owner() {
  local port="$1"
  docker ps --filter "publish=${port}" --format '{{.Names}}'
}

assert_port_available() {
  local port="$1"
  local owners

  owners="$(find_port_owner "$port")"
  if [ -n "$owners" ]; then
    echo "El puerto ${port} sigue ocupado por estos contenedores:"
    echo "$owners"
    echo "Libera ese puerto o cambia ${port} en .env.docker antes de desplegar."
    exit 1
  fi
}

echo ">>> Deteniendo backend y frontend..."
docker compose $ENV_FILES down --remove-orphans || true

echo ">>> Verificando puertos..."
assert_port_available "$backend_port"
assert_port_available "$frontend_port"

echo ">>> Rebuild y deploy..."
docker compose $ENV_FILES up -d --build --force-recreate
docker image prune -f

if [ -n "${APP_VERSION:-}" ]; then
  DEPLOYED_VERSION="$APP_VERSION"
else
  DEPLOYED_VERSION="$(grep '^APP_VERSION=' .env.docker | cut -d= -f2)"
fi

echo ">>> Deploy completado. Version: ${DEPLOYED_VERSION:-latest}"
docker compose $ENV_FILES ps
