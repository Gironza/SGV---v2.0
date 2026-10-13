# Etapa 1: Build con Node y pnpm fijo
FROM node:20-alpine AS workdir

WORKDIR /app

# Instalamos pnpm de forma global y segura con npm (evita el lío de Corepack)
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias con pnpm
RUN pnpm install

# Copiar el resto del código y compilar
COPY . .
RUN pnpm build

# Etapa 2: Servidor Web Nginx para producción
FROM nginx:alpine

COPY --from=workdir /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]