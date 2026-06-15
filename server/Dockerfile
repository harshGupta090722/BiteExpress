# Use Node.js 20 LTS Alpine image for smaller size and better security
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml first for better Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Build the TypeScript application
RUN pnpm run build

# Remove development dependencies to reduce image size
RUN pnpm prune --production

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to the non-root user
USER nodejs

## Add node env path to PATH variable
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 4000


# Start the application
CMD ["pnpm", "start"]