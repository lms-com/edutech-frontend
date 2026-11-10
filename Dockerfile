# -------------------------------------------------------------
# Stage 1: Build source React + TypeScript + Vite
# -------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Tận dụng Docker layer cache cho package dependencies
COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Serve tĩnh bằng Nginx Alpine siêu nhẹ (~20MB)
# -------------------------------------------------------------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
