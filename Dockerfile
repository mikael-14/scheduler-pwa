FROM node:20-alpine

# Add build dependencies for better compatibility
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with clean cache
RUN npm install && npm cache clean --force

# Copy rest of the application
COPY . .

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5173', (r) => r.statusCode !== 200 ? process.exit(1) : process.exit(0))"

EXPOSE 5173

CMD ["npm", "run", "dev"]