# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY dashboard/package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY dashboard/ ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY dashboard/package*.json ./
RUN npm ci --production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./

# Set environment to production
ENV NODE_ENV production
ENV PORT 3000

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]