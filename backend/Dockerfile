# ============================================================
# LIQUID FLOW MONITOR - BACKEND DOCKERFILE
# Versao: 1.0
# Runtime: Node.js 20 LTS
# ============================================================

# Stage 1: Build
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Instalar dependencias de build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependencias
COPY package*.json ./

# Instalar todas as dependencias (incluindo devDependencies para build)
RUN corepack enable && corepack prepare pnpm@8.15.1 --activate \
    && pnpm install --frozen-lockfile=false

# Copiar codigo fonte
COPY . .

# Build do TypeScript
RUN ./node_modules/.bin/tsc

# Stage 2: Production
FROM node:20-bullseye-slim AS production

WORKDIR /app

# Criar usuario nao-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copiar apenas arquivos necessarios
COPY --from=builder --chown=backend:nodejs /app/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/package*.json ./

# Mudar para usuario nao-root
USER backend

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando de execucao
CMD ["node", "dist/server.js"]
