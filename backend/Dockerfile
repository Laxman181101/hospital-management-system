# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (only production)
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose application port
EXPOSE 5000

# Set default environment variables
ENV PORT=5000
ENV NODE_ENV=production

# Command to run the backend server
CMD ["node", "server.js"]
