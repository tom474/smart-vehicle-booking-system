# Step 1: Build stage
FROM node:lts-alpine AS builder

# Set working directory
WORKDIR /app

# Install only necessary files first for caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Step 2: Production stage
FROM node:lts-alpine AS production

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Use environment variable or fallback
ENV PORT=5500

# Expose port
EXPOSE ${PORT}

# Run compiled app
CMD ["node", "dist/src/app.js"]
