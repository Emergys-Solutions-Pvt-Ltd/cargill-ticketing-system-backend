# Multi-stage Dockerfile for Node.js Express backend

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production Runner
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy installed dependencies and source code
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

# Set permission for node user
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
