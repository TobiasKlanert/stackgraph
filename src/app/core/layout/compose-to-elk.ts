import type { ElkNode } from 'elkjs/lib/elk.bundled.js';
import { ComposeModel } from '../models/compose.model';
import { StackGraphNode, StackGraphEdge, NodeType, EdgeType } from '../models/layout.model';

const nodeWidth = 160;
const nodeHeight = 64;

const nodeIdPrefixes: Record<NodeType, string> = {
  service: '',
  network: 'net:',
  volume: 'vol:',
};

const edgeIdSeparators: Record<EdgeType, string> = {
  dependsOn: '->',
  network: '--',
  volume: '--',
};

export function toElkGraph(model: ComposeModel): ElkNode {
  const serviceNodes: StackGraphNode[] = model.services.map((s) => toNode(s.name, 'service'));
  const networkNodes: StackGraphNode[] = model.networks.map((n) => toNode(n.name, 'network'));
  const volumeNodes: StackGraphNode[] = model.volumes.map((v) => toNode(v.name, 'volume'));

  const children = [...serviceNodes, ...networkNodes, ...volumeNodes];

  const knownIds = new Set(children.map((c) => c.id));

  const dependencyEdges: StackGraphEdge[] = model.services.flatMap((service) =>
    service.dependsOn.map((dp) => makeEdge(service.name, dp, 'dependsOn'))
  );

  const networkEdges: StackGraphEdge[] = model.services.flatMap((service) =>
    service.networks.map((n) => makeEdge(service.name, `net:${n}`, 'network'))
  );

  const volumeEdges: StackGraphEdge[] = model.services.flatMap((service) =>
    service.volumes
      .filter((vm) => vm.type === 'volume' && vm.source)
      .map((vm) => makeEdge(service.name, `vol:${vm.source}`, 'volume'))
  );

  const edges = [...dependencyEdges, ...networkEdges, ...volumeEdges].filter(
    (edge) =>
      edge.sources.every((id) => knownIds.has(id)) && edge.targets.every((id) => knownIds.has(id))
  );

  return {
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
}

function toNode(name: string, nodeType: NodeType): StackGraphNode {
  return {
    id: `${nodeIdPrefixes[nodeType]}${name}`,
    width: nodeWidth,
    height: nodeHeight,
    nodeType: nodeType,
  };
}

function makeEdge(from: string, to: string, edgeType: EdgeType): StackGraphEdge {
  return {
    id: `${from}${edgeIdSeparators[edgeType]}${to}`,
    sources: [from],
    targets: [to],
    edgeType,
  };
}
