# Dockerfile optimizado para el Backend de Oasis Nicaragua en Fly.io
FROM node:19-alpine AS base

# 1. Instalar dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar configuración de paquetes
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instalar dependencias completas para compilación
RUN npm ci

# 2. Compilar aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Compilar Next.js en modo standalone
RUN npm run build

# 3. Imagen de ejecución final
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000
ENV HOSTNAME="0.0.0.0"

# Copiar archivos compilados y dependencias necesarias
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/.next ./.next

# Exponer el puerto del Backend custom HTTP/Socket.io server
EXPOSE 8000

# Comando para iniciar el Backend custom HTTP + Socket.io Server con npx jiti
CMD ["npx", "jiti", "src/server.ts"]
