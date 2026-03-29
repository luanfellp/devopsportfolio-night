# Estágio 1: Build (Astro)
FROM node:lts-alpine AS build

# Atualiza os pacotes do SO para corrigir vulnerabilidades (CVEs)
RUN apk update && apk upgrade 

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Runtime (Servidor Web Nginx)
FROM nginx:alpine

# Atualiza o SO do servidor final também (Segurança em camadas)
RUN apk update && apk upgrade

# Copia apenas o resultado do build do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]