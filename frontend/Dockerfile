FROM node:24-alpine3.20 AS build

RUN corepack enable

WORKDIR /app

COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
COPY backend/package.json backend/pnpm-lock.yaml ./backend/

WORKDIR /app/frontend
RUN pnpm install --frozen-lockfile

WORKDIR /app/backend
RUN pnpm install --frozen-lockfile

WORKDIR /app/frontend
COPY frontend/ ./
COPY backend/src ../backend/src

ARG VITE_TRPC_URL=/
ARG VITE_REPORTS_BASE_URL=http://localhost:9001

ENV VITE_TRPC_URL=${VITE_TRPC_URL}
ENV VITE_REPORTS_BASE_URL=${VITE_REPORTS_BASE_URL}

RUN pnpm build

FROM nginx:alpine3.20-slim AS runtime

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
