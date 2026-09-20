import { parseCompose } from './yaml-parser';

describe('parseCompose', () => {
  it('parses a minimal valid compose file', () => {
    const source = `
    services:
      web:
        image: nginx
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.model).toEqual({
        services: [
          {
            name: 'web',
            image: 'nginx',
            ports: [],
            dependsOn: [],
            networks: [],
            volumes: [],
          },
        ],
        networks: [],
        volumes: [],
      });
    }
  });

  it('parses both long and short port forms', () => {
    const source = `
    services:
      web:
        image: nginx
        ports:
          - '8080:80'
          - '443'
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.model.services).toHaveLength(1);
      expect(result.model.services[0]?.ports).toEqual([
        { host: '8080', container: '80' },
        { container: '443' },
      ]);
    }
  });

  it('parses volumes', () => {
    const source = `
    services:
      app:
        volumes:
          - './data:/app/data'  
          - 'named-volume:/var/lib/db'
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.model.services).toHaveLength(1);
      expect(result.model.services[0]?.volumes).toEqual([
        { source: './data', target: '/app/data', type: 'bind' },
        { source: 'named-volume', target: '/var/lib/db', type: 'volume' },
      ]);
    }
  });

  it('accepts networks and volumes declared without a value', () => {
    const source = `
    services: 
      app:
        image: nginx
    networks:
      backend:
    volumes:
      db_data:
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.model.networks).toEqual([{ name: 'backend' }]);
      expect(result.model.volumes).toEqual([{ name: 'db_data' }]);
    }
  });

  it('accepts networks in map format on the service', () => {
    const source = `
    services:
      web:
        image: nginx
        networks:
          backend:
            aliases:
              - api
          frontend:
    networks:
      backend:
      frontend:
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.model.services[0]?.networks).toEqual(['backend', 'frontend']);
    }
  });

  it('accepts dependencies in map format on the service', () => {
    const source = `
    services:
      web:
        image: nginx
        depends_on:
          db:
            condition: service_healthy
          cache:
            condition: service_started
      db:
        image: postgres:16
      cache:
        image: redis:7
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.model.services[0]?.dependsOn).toEqual(['db', 'cache']);
    }
  });

  it('treats list and map form alike', () => {
    const source = `
    services:
      web:
        image: nginx
        networks:
          - backend
          - frontend
        depends_on:
          - api
      api:
        image: node:22-alpine
        networks:
          backend:
        depends_on:
          db:
            condition: service_healthy
      db:
        image: postgres:16
    networks:
      backend:
      frontend:
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.model.services[0]?.networks).toEqual(['backend', 'frontend']);
      expect(result.model.services[0]?.dependsOn).toEqual(['api']);
      expect(result.model.services[1]?.networks).toEqual(['backend']);
      expect(result.model.services[1]?.dependsOn).toEqual(['db']);
    }
  });

  it('returns an error when no services are present', () => {
    const source = `
    networks:
      web:
        external: true
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('does not contain any services');
    }
  });

  it('reports a syntax error with a line number', () => {
    const source = `
    services:
      app:
        image: "nginx
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.line).toBeDefined();
    }
  });

  it('reports all errors together as a list', () => {
    const source = `
    services:
      app: "kaputt"
      db: 123
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]?.path).toBe('services.app');
      expect(result.errors[1]?.path).toBe('services.db');
    }
  });

  it('reports networks with incorrect values', () => {
    const source = `
    services: 
      app:
        image: nginx
    networks:
      backend: "kaputt"
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.path).toBe('networks.backend');
    }
  });

  it('reports volumes with incorrect values', () => {
    const source = `
    services: 
      app:
        image: nginx
    volumes:
      db_data: "kaputt"
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.path).toBe('volumes.db_data');
    }
  });

  it('reports services declared without a value', () => {
    const source = `
    services:
      app:
    `;

    const result = parseCompose(source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.path).toBe('services.app');
    }
  });
});
