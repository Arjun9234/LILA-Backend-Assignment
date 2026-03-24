# Stage 1: Build TypeScript Nakama modules
FROM node:20-alpine AS builder

WORKDIR /app/modules

COPY nakama/data/modules/package*.json ./
RUN npm ci

COPY nakama/data/modules/src ./src
COPY nakama/data/modules/tsconfig.json ./
COPY nakama/data/modules/scripts ./scripts

RUN npm run build

# Stage 2: Nakama runtime
FROM heroiclabs/nakama:3.21.1

COPY --from=builder /app/modules/build /nakama/data/modules/build
COPY nakama/data/nakama-config.yml /nakama/data/nakama-config.yml

EXPOSE 7349 7350 7351