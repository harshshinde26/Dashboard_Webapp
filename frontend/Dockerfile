# Multi-stage build for React frontend
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY frontend/ ./

# Build the React application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy the React build from the previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Add health check script
RUN echo '#!/bin/sh' > /health-check.sh \
    && echo 'curl -f http://localhost/ || exit 1' >> /health-check.sh \
    && chmod +x /health-check.sh

# Install curl for health checks
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /health-check.sh

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 