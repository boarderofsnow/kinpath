# ── Build stage ───────────────────────────────────────────────────────────────
# Must be built with the repo root as Docker build context so npm workspaces
# can resolve @kinpath/shared.
#
# Railway config:
#   Root Directory  →  .  (repo root, NOT packages/api)
#   Dockerfile Path →  packages/api/Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /repo

# Copy workspace manifests + root tsconfig (shared/api extend it) for better layer caching
COPY package.json package-lock.json tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json     ./packages/api/

# Install all workspace dependencies (includes devDeps for TypeScript)
RUN npm install

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY packages/api/    ./packages/api/

# 1. Build @kinpath/shared → packages/shared/dist/
RUN npm run build --workspace=@kinpath/shared

# 2. Build @kinpath/api → packages/api/dist/
RUN npm run build --workspace=@kinpath/api


# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production

# Copy workspace manifests and install production deps only
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json     ./packages/api/
RUN npm install --omit=dev

# Copy compiled output from builder
COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/packages/api/dist    ./packages/api/dist

EXPOSE 3000
WORKDIR /repo/packages/api
CMD ["node", "dist/index.js"]
