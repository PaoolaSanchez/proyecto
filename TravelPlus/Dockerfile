# ========================================
# DOCKERFILE PARA TRAVELPIN
# ========================================

FROM node:20-alpine

# Instalar dependencias del sistema para better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production
RUN npm ci

# Copiar código fuente
COPY . .

# Build de Angular SSR
RUN npm run build

# Crear directorio para la base de datos
RUN mkdir -p /app/data

# Puerto (Railway lo asigna automáticamente)
ENV PORT=4000
ENV NODE_ENV=production
ENV DB_PATH=/app/data/BDTravelPin.db

EXPOSE 4000

# Ejecutar el servidor SSR
CMD ["npm", "run", "serve:ssr:TravelPin"]
