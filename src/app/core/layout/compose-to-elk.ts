import type { ElkNode } from 'elkjs/lib/elk.bundled.js';
import { ComposeModel } from '../models/compose.model';

export function toElkGraph(model: ComposeModel): ElkNode {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '50',
      'elk.spacing.nodeNode': '50',
    },
    children: model.services.map((service) => ({
      id: service.name,
      width: 160,
      height: 64,
    })),
    edges: model.services.flatMap((service) =>
      service.dependsOn.map((dp) => ({
        id: `${service.name}->${dp}`,
        sources: [service.name],
        targets: [dp],
      }))
    ),
  };

  return graph;
}
