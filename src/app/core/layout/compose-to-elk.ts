import type { ElkNode } from 'elkjs/lib/elk.bundled.js';
import { ComposeModel, ServiceNode } from '../models/compose.model';

export function toElkGraph(model: ComposeModel): ElkNode {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '50',
      'elk.spacing.nodeNode': '50',
    },
    children: model.services.map((service: ServiceNode) => ({
      id: service.name,
      width: 160,
      height: 64,
    })),
    edges: [],
  };
  console.log(JSON.stringify(graph, null, 2));
}

const source: ComposeModel = {
  services: [
    {
      name: 'web',
      ports: [],
      dependsOn: [],
      networks: [],
      volumes: [],
    },
    {
      name: 'api',
      ports: [],
      dependsOn: [],
      networks: [],
      volumes: [],
    },
  ],
  networks: [],
  volumes: [],
};
toElkGraph(source);
