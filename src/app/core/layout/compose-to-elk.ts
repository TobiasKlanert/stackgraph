import type { ElkNode } from 'elkjs/lib/elk.bundled.js';
import { ComposeModel } from '../models/compose.model';
import { StackGraphNode, StackGraphEdge } from '../models/layout.model';

export function toElkGraph(model: ComposeModel): ElkNode {
  const serviceNodes: StackGraphNode[] = model.services.map((service) => ({
    id: service.name,
    width: 160,
    height: 64,
    nodeType: 'service',
  }));

  const networkNodes: StackGraphNode[] = model.networks.map((network) => ({
    id: `net:${network.name}`,
    width: 160,
    height: 64,
    nodeType: 'network',
  }));

  const volumeNodes: StackGraphNode[] = model.volumes.map((volume) => ({
    id: `vol:${volume.name}`,
    width: 160,
    height: 64,
    nodeType: 'volume',
  }));

  const children = [...serviceNodes, ...networkNodes, ...volumeNodes];

  const knownIds = new Set(children.map((c) => c.id));

  const dependencyEdges: StackGraphEdge[] = model.services.flatMap((service) =>
    service.dependsOn.map((dp) => ({
      id: `${service.name}->${dp}`,
      sources: [service.name],
      targets: [dp],
      edgeType: 'dependsOn',
    }))
  );

  const networkEdges: StackGraphEdge[] = model.services.flatMap((service) =>
    service.networks.map((n) => ({
      id: `${service.name}--net:${n}`,
      sources: [service.name],
      targets: [`net:${n}`],
      edgeType: 'network',
    }))
  );

  const volumeEdges: StackGraphEdge[] = model.services.flatMap((service) =>
    service.volumes
      .filter((vm) => vm.type === 'volume' && vm.source)
      .map((vm) => ({
        id: `${service.name}--vol:${vm.source}`,
        sources: [service.name],
        targets: [`vol:${vm.source}`],
        edgeType: 'volume',
      }))
  );

  const edges = [...dependencyEdges, ...networkEdges, ...volumeEdges].filter(
    (edge) =>
      edge.sources.every((id) => knownIds.has(id)) && edge.targets.every((id) => knownIds.has(id))
  );

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '50',
      'elk.spacing.nodeNode': '50',
    },
    children,
    edges,
  };

  return graph;
}
