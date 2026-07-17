### Multi-stage Dockerfile for building the Vite React app and serving with nginx
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./ 
RUN npm install --production=false

# Copy source and build
COPY . .
RUN npm run build

# Production stage: serve built files with nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
