# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Set production environment variables
ENV REACT_APP_API_URL=https://redistribuidor-back.silhouetteexperts.com.br
ENV REACT_APP_FRONTEND_URL=https://redistribuidor-front.silhouetteexperts.com.br
ENV GENERATE_SOURCEMAP=false

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

# Install dumb-init for proper signal handling and timezone data
RUN apk add --no-cache dumb-init tzdata

# Set timezone
ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install serve globally
RUN npm install -g serve

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webhook -u 1001 -G nodejs

# Copy built app
COPY --from=build /app/build /app/build

# Set proper permissions
RUN chown -R webhook:nodejs /app

# Switch to non-root user
USER webhook

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start serve with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["serve", "-s", "/app/build", "-l", "3000"]
