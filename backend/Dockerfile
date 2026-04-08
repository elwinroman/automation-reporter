FROM node:24-alpine3.20 AS build

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN pnpm build && pnpm prune --prod

FROM node:24-alpine3.20 AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV LOGS_DIRECTORY=/data/logs

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js", "serve", "--host", "0.0.0.0", "--port", "3000"]
