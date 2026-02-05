# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install security updates, ffmpeg, and build deps for canvas (title overlay)
RUN apk update && apk upgrade && \
    apk add --no-cache \
        ffmpeg \
        python3 \
        make \
        g++ \
        cairo-dev \
        pango-dev \
        jpeg-dev \
        giflib-dev \
        librsvg-dev \
    && rm -rf /var/cache/apk/*

# Install dependencies stage
FROM base AS deps
WORKDIR /app
ENV NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install --omit=dev

# Build stage
FROM base AS builder
WORKDIR /app
ENV NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
COPY src ./src
COPY tsconfig.docker.json ./
RUN npx tsc -p tsconfig.docker.json

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application and dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create necessary directories with proper permissions
RUN mkdir -p uploads processed logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3051

# Health check with better error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3051/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Start server
CMD ["node", "dist/index.js"]
