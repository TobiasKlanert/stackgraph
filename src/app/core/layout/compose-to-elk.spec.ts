import { ComposeModel } from '../models/compose.model';
import { StackGraphNode } from '../models/layout.model';
import { toElkGraph } from './compose-to-elk';

describe('toElkGraph', () => {
  const model: ComposeModel = {
    services: [
      {
        name: 'web',
        image: 'nginx:latest',
        ports: [{ host: '8080', container: '80' }],
        dependsOn: ['api', 'db'],
        networks: ['web'],
        volumes: [{ source: 'db_data', target: '/var/lib/...', type: 'volume' }],
      },
      {
        name: 'api',
        image: 'node:20-alpine',
        ports: [],
        dependsOn: ['db'],
        networks: [],
        volumes: [],
      },
      {
        name: 'db',
        ports: [],
        dependsOn: [],
        networks: [],
        volumes: [],
      },
    ],
    networks: [
      {
        name: 'web',
      },
    ],
    volumes: [{ name: 'db_data' }],
  };

  const result = toElkGraph(model);

  it('determines the children correctly', () => {
    expect(result.children?.map((c) => c.id)).toEqual([
      'web',
      'api',
      'db',
      'net:web',
      'vol:db_data',
    ]);
  });

  it('determines the node types correctly', () => {
    expect(result.children?.map((c) => (c as StackGraphNode).nodeType)).toEqual([
      'service',
      'service',
      'service',
      'network',
      'volume',
    ]);
  });

  it('attaches display data without id prefixes', () => {
    const nodes = result.children as StackGraphNode[];

    expect(nodes.map((n) => n.display.name)).toEqual(['web', 'api', 'db', 'web', 'db_data']);
  });

  it('formats ports and keeps the image for services', () => {
    const [web] = result.children as StackGraphNode[];

    expect(web?.nodeType === 'service' && web.display).toEqual({
      name: 'web',
      image: 'nginx:latest',
      ports: ['8080:80'],
    });
  });

  it('leaves the image out for services built from source', () => {
    const db = (result.children as StackGraphNode[]).find((n) => n.id === 'db');

    expect(db?.display).not.toHaveProperty('image');
  });

  it('sizes nodes by their content', () => {
    const [web, api] = result.children ?? [];

    expect(web).toMatchObject({ width: 196, height: 76 });
    expect(api).toMatchObject({ width: 196, height: 58 });
  });

  it('does not set ELK ports, which would change the layout', () => {
    expect(result.children?.every((n) => n.ports === undefined)).toBe(true);
  });

  it('determines the edges correctly', () => {
    expect(result.edges).toEqual([
      {
        edgeType: 'dependsOn',
        id: 'web->api',
        sources: ['web'],
        targets: ['api'],
      },
      {
        edgeType: 'dependsOn',
        id: 'web->db',
        sources: ['web'],
        targets: ['db'],
      },
      {
        edgeType: 'dependsOn',
        id: 'api->db',
        sources: ['api'],
        targets: ['db'],
      },
      {
        edgeType: 'network',
        id: 'web--net:web',
        sources: ['web'],
        targets: ['net:web'],
      },
      {
        edgeType: 'volume',
        id: 'web--vol:db_data',
        sources: ['web'],
        targets: ['vol:db_data'],
      },
    ]);
  });
});
