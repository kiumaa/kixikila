# KIXIKILA Backend Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Remove development files
RUN rm -rf tests/ docs/ *.md .env.example

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S kixikila -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=kixikila:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=kixikila:nodejs /app/src ./src
COPY --from=builder --chown=kixikila:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p logs && chown kixikila:nodejs logs

# Switch to non-root user
USER kixikila

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application with dumb-init
CMD ["dumb-init", "node", "src/server.js"]