# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install Firebase CLI globally
RUN npm install -g firebase-tools

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY .firebaserc firebase.json ./

# Run Firebase hosting deployment
CMD ["firebase", "deploy", "--only", "hosting", "--non-interactive"]
