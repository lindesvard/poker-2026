############################
# Dependencies
############################
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

############################
# Build
############################
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

############################
# Runtime
############################
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    POKER_STATE_PATH=/data/state.json

RUN mkdir -p /data && chown -R node:node /data
USER node

COPY --from=build --chown=node:node /app/.output ./

EXPOSE 3000
VOLUME ["/data"]

CMD ["node", "./server/index.mjs"]
