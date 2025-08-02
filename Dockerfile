# Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Expose port and start app
EXPOSE 8080
CMD ["node", "dist/main.js"]
