# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN node /app/node_modules/.bin/nest build

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
