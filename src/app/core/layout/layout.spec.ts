import { ComposeModel } from '../models/compose.model';
import { toElkGraph } from './compose-to-elk';

describe('toElkGraph', () => {
  const model: ComposeModel = {
    services: [
      {
        name: 'web',
        image: 'nginx:latest',
        ports: [],
        dependsOn: ['api', 'db'],
        networks: [],
        volumes: [],
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
    networks: [],
    volumes: [],
  };

  const result = toElkGraph(model);

  it('determines the children correctly', () => {
    expect(result.children?.map((c) => c.id)).toEqual(['web', 'api', 'db']);
  });

  it('determines the edges correctly', () => {
    expect(result.edges).toEqual([
      {
        id: 'web->api',
        sources: ['web'],
        targets: ['api'],
      },
      {
        id: 'web->db',
        sources: ['web'],
        targets: ['db'],
      },
      {
        id: 'api->db',
        sources: ['api'],
        targets: ['db'],
      },
    ]);
  });
});
