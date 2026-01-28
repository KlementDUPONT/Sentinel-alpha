FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p data logs

# Expose port (pour les health checks)
EXPOSE 8080

# Start the bot
CMD ["node", "src/bot.js"]
