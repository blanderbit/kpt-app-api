# Build stage
FROM node:22-bullseye AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

RUN apt-get update && apt-get install -y default-mysql-client && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN npm i

# Copy source code
COPY . .

# Build the application
RUN node /app/node_modules/.bin/nest build

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
