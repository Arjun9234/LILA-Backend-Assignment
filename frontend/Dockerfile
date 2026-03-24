# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Get Nakama configuration from environment variables
# Defaults for local development
ARG VITE_NAKAMA_HOST=localhost
ARG VITE_NAKAMA_PORT=7350
ARG VITE_NAKAMA_SSL=false

# Set environment variables for build
ENV VITE_NAKAMA_HOST=${VITE_NAKAMA_HOST}
ENV VITE_NAKAMA_PORT=${VITE_NAKAMA_PORT}
ENV VITE_NAKAMA_SSL=${VITE_NAKAMA_SSL}

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
