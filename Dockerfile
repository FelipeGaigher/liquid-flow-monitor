# ============================================================
# LIQUID FLOW MONITOR - FULL STACK DOCKERFILE
# Versao: 1.0
# Frontend: Nginx + Vite/React
# Backend: Node.js 20 LTS
# ============================================================

# Build argument
ARG NODE_ENV=production

# ============================================================
# Stage 1: Build Frontend
# ============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar arquivos de dependencias do frontend
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar codigo fonte do frontend
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Build do frontend
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ============================================================
# Stage 2: Build Backend
# ============================================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Instalar dependencias de build
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependencias do backend
COPY backend/package*.json ./

# Instalar todas as dependencias
RUN npm ci

# Copiar codigo fonte do backend
COPY backend/src/ ./src/
COPY backend/tsconfig.json ./
COPY backend/knexfile.ts ./

# Build do TypeScript
RUN npm run build

# Remover devDependencies
RUN npm prune --production

# ============================================================
# Stage 3: Production Image
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

# Instalar nginx
RUN apk add --no-cache nginx supervisor

# Criar usuario nao-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001

# Criar diretorios necessarios
RUN mkdir -p /var/log/supervisor /run/nginx && \
    chown -R appuser:appgroup /var/log/supervisor /run/nginx /var/lib/nginx

# Copiar frontend build
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copiar backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/

# Configuracao do Nginx
COPY <<'EOF' /etc/nginx/http.d/default.conf
server {
    listen 80;
    server_name _;

    # Frontend (SPA)
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache para assets estaticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
    }
}
EOF

# Configuracao do Supervisor
COPY <<'EOF' /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
user=root

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:backend]
command=node /app/backend/dist/server.js
directory=/app/backend
autostart=true
autorestart=true
user=appuser
environment=NODE_ENV="production"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Comando de execucao
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
