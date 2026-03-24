# Stage 1: Build TypeScript modules
FROM node:20-alpine AS builder

WORKDIR /app/modules

# Copy package files (paths from root)
COPY nakama/data/modules/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY nakama/data/modules/src ./src
COPY nakama/data/modules/tsconfig.json ./
COPY nakama/data/modules/scripts ./scripts

# Build TypeScript
RUN npm run build

# Stage 2: Nakama runtime
FROM heroiclabs/nakama:3.21.1

# Copy compiled modules from builder
COPY --from=builder /app/modules/build /nakama/data/modules/build

# Copy Nakama configuration
COPY nakama/data/nakama-config.yml /nakama/data/nakama-config.yml

# Expose ports
EXPOSE 7349 7350 7351

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:7350/ || exit 1

# Start Nakama with database migrations
ENTRYPOINT ["/bin/sh", "-ecx", \
  "/nakama/nakama migrate up --database.address postgres://postgres:${POSTGRES_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/nakama && \
  exec /nakama/nakama --config /nakama/data/nakama-config.yml --database.address postgres://postgres:${POSTGRES_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/nakama"]