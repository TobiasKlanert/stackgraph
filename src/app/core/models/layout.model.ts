import { type ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';

export type NodeType = 'service' | 'network' | 'volume';

export type EdgeType = 'dependsOn' | 'network' | 'volume';

export interface StackGraphNode extends ElkNode {
  nodeType: NodeType;
}

export interface StackGraphEdge extends ElkExtendedEdge {
  edgeType: EdgeType;
}

export interface PositionedGraph extends ElkNode {
  children?: StackGraphNode[];
  edges?: StackGraphEdge[];
}
