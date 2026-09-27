export const sampleCompose = `
services:
  proxy:
    image: caddy:2-alpine
    ports:
      - '80:80'
      - '443:443'
    networks:
      - edge
    depends_on:
      - frontend

  frontend:
    image: node:22-alpine
    ports:
      - '3000'
    networks:
      - edge
      - internal
    depends_on:
      - api

  api:
    image: node:22-alpine
    ports:
      - '8080:8080'
    networks:
      - internal
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started

  db:
    image: postgres:16-alpine
    networks:
      - internal
    volumes:
      - 'db_data:/var/lib/postgresql/data'

  cache:
    image: redis:7-alpine
    networks:
      - internal
    volumes:
      - 'cache_data:/data'

networks:
  edge:
  internal:

volumes:
  db_data:
  cache_data:
`;
