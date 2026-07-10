# ---- Stage 1: Build ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/stackgraph/browser/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]