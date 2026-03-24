# Stage 1: Build TypeScript modules
FROM node:20-alpine AS builder

WORKDIR /app/modules

# Copy package files
COPY data/modules/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY data/modules/src ./src
COPY data/modules/tsconfig.json ./
COPY data/modules/scripts ./scripts

# Build TypeScript
RUN npm run build

# Stage 2: Nakama runtime
FROM heroiclabs/nakama:3.21.1

# Copy compiled modules from builder
COPY --from=builder /app/modules/build /nakama/data/modules/build

# Copy Nakama configuration
COPY data/nakama-config.yml /nakama/data/nakama-config.yml

# Expose ports
EXPOSE 7349 7350 7351