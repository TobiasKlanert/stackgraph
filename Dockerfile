# ---- Stage 1: Build ----
# Node-Version muss zu .nvmrc / package.json#engines passen (engine-strict prüft das)
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm ci

COPY . .

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/stackgraph/browser/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]