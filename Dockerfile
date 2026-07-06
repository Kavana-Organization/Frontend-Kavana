# Dockerfile for Frontend-Kavana (Next.js)
# Multi-stage build

# ──────────────────────────────────────────────
# Base stage
# ──────────────────────────────────────────────
FROM node:22-alpine AS base

RUN apk add --no-cache dumb-init curl

# ──────────────────────────────────────────────
# Dependencies stage
# ──────────────────────────────────────────────
FROM base AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force

# ──────────────────────────────────────────────
# Build stage
# ──────────────────────────────────────────────
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for Next.js
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

RUN npm run build

# ──────────────────────────────────────────────
# Production stage
# ──────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy build artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# Switch to non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S kavana -u 1001 -G nodejs
USER kavana

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]