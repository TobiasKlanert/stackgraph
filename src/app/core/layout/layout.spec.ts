import { TestBed } from '@angular/core/testing';
import { ComposeModel } from '../models/compose.model';
import { StackGraphNode } from '../models/layout.model';
import { Layout } from './layout';

describe('Layout', () => {
  const model: ComposeModel = {
    services: [
      {
        name: 'web',
        image: 'nginx:alpine',
        ports: [{ host: '80', container: '80' }],
        dependsOn: [],
        networks: ['edge'],
        volumes: [],
      },
    ],
    networks: [{ name: 'edge' }],
    volumes: [],
  };

  it('keeps node types, display data and sizes through the ELK round trip', async () => {
    const graph = await TestBed.inject(Layout).layout(model);
    const [web, edge] = (graph.children ?? []) as StackGraphNode[];

    expect(web).toMatchObject({
      nodeType: 'service',
      display: { name: 'web', image: 'nginx:alpine', ports: ['80:80'] },
      width: 196,
      height: 76,
    });
    expect(edge).toMatchObject({ nodeType: 'network', display: { name: 'edge' } });
    expect(typeof web?.x).toBe('number');
  });
});
