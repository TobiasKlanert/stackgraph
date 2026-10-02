import type { ElkNode } from 'elkjs/lib/elk.bundled.js';
import { ComposeModel, NetworkNode, ServiceNode, VolumeNode } from '../models/compose.model';
import {
  EdgeType,
  NetworkGraphNode,
  NodeType,
  ServiceDisplay,
  ServiceGraphNode,
  StackGraphEdge,
  StackGraphNode,
  VolumeGraphNode,
} from '../models/layout.model';
import { formatPort } from '../format/format-port';
import { networkSize, serviceSize, volumeSize } from './node-geometry';

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
  const children: StackGraphNode[] = [
    ...model.services.map(toServiceNode),
    ...model.networks.map(toNetworkNode),
    ...model.volumes.map(toVolumeNode),
  ];

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

function toServiceNode(service: ServiceNode): ServiceGraphNode {
  const display: ServiceDisplay = {
    name: service.name,
    ports: service.ports.map(formatPort),
    // exactOptionalPropertyTypes: leave the key out instead of setting undefined
    ...(service.image !== undefined && { image: service.image }),
  };
  return {
    id: nodeId(service.name, 'service'),
    nodeType: 'service',
    display,
    ...serviceSize(display.ports),
  };
}

function toNetworkNode(network: NetworkNode): NetworkGraphNode {
  return {
    id: nodeId(network.name, 'network'),
    nodeType: 'network',
    display: { name: network.name },
    ...networkSize(network.name),
  };
}

function toVolumeNode(volume: VolumeNode): VolumeGraphNode {
  return {
    id: nodeId(volume.name, 'volume'),
    nodeType: 'volume',
    display: { name: volume.name },
    ...volumeSize(volume.name),
  };
}

function nodeId(name: string, nodeType: NodeType): string {
  return `${nodeIdPrefixes[nodeType]}${name}`;
}

function makeEdge(from: string, to: string, edgeType: EdgeType): StackGraphEdge {
  return {
    id: `${from}${edgeIdSeparators[edgeType]}${to}`,
    sources: [from],
    targets: [to],
    edgeType,
  };
}
