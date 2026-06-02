# ============================================================
# Stage 1: Install ALL dependencies (including devDependencies)
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package manifests first — Docker layer caching means
# deps are only re-installed when package*.json changes.
COPY package.json package-lock.json ./

# npm ci ensures a clean, reproducible install from the lockfile.
# --ignore-scripts prevents post-install scripts from running during build
# (mitigates supply-chain attacks from compromised packages).
RUN npm ci --ignore-scripts

# ============================================================
# Stage 2: Production image — minimal surface area
# ============================================================
FROM node:20-alpine AS production

# Security: add tini as PID 1 for proper signal handling
# (Node.js does not handle SIGTERM/SIGINT correctly as PID 1)
RUN apk add --no-cache tini

WORKDIR /app

# Copy only the package manifests
COPY package.json package-lock.json ./

# Install production-only dependencies — no devDependencies in final image
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

# Copy ONLY the application source — no .env, no .git, no node_modules (see .dockerignore)
COPY src/ ./src/
COPY public/ ./public/

# Security: drop all privileges — run as the built-in 'node' user (UID 1000)
# This prevents container-escape attacks from gaining root on the host.
USER node

# Expose the application port (documentation + runtime metadata)
EXPOSE 3000

# Use tini as the entrypoint for proper signal forwarding
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "src/app.js"]
