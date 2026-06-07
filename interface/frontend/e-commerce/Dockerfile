# ══════════════════════════════════════
#  Stage 1 : Build React (Vite)
# ══════════════════════════════════════
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# L'API passe par le gateway → URL relative
ENV VITE_API_URL=/api
RUN npm run build

# ══════════════════════════════════════
#  Stage 2 : Servir avec Nginx
# ══════════════════════════════════════
FROM nginx:alpine
RUN apk upgrade --no-cache

# Copier le build Vite (dist, pas build)
COPY --from=build /app/dist /usr/share/nginx/html

# Config Nginx pour le SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]