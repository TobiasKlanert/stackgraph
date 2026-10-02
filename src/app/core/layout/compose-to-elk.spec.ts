import { ComposeModel } from '../models/compose.model';
import { StackGraphNode } from '../models/layout.model';
import { toElkGraph } from './compose-to-elk';

describe('toElkGraph', () => {
  const model: ComposeModel = {
    services: [
      {
        name: 'web',
        image: 'nginx:latest',
        ports: [],
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
        image: 'postgres:16',
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
