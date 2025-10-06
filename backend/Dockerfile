# Multi-stage Dockerfile for xRat Backend
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Install development dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Create logs directory and set permissions
RUN mkdir -p /app/logs && \
    chown -R nodeuser:nodejs /app

# USER nodeuser  # Commented out for development to allow volume writes

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy source code
COPY --chown=node:node . .

# Create non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
