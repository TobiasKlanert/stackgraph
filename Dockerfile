# ---- Stage 1: Build ----
# Node-Version muss zu .nvmrc / package.json#engines passen (engine-strict prüft das).
# Exakt gepinnt, damit CI und Image-Build dieselbe Version nutzen.
FROM node:24.22.2-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm ci

COPY . .

RUN npm run build

# ---- Stage 2: Serve ----
# Unprivileged variant: nginx runs as a non-root user and listens on 8080.
FROM nginx/nginx-unprivileged:1.30-alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/stackgraph/browser/ /usr/share/nginx/html/

EXPOSE 8080

# Checks that nginx answers and the app shell is in place. The deploy script
# waits for this before it calls a deploy successful, and rolls back if not.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
