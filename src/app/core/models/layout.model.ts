import { type ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';

export type NodeType = 'service' | 'network' | 'volume';

export type EdgeType = 'dependsOn' | 'network' | 'volume';

/** What a service node shows: name, image and formatted port labels. */
export interface ServiceDisplay {
  name: string;
  image?: string;
  ports: string[];
}

/** Networks and volumes show only their name. */
export interface NamedDisplay {
  name: string;
}

/*
 * Display data sits under `display` instead of top-level fields: ElkNode
 * already has `ports` (ELK port definitions) and `labels`, so top-level
 * names would collide in the types and be interpreted by ELK.
 */
export interface ServiceGraphNode extends ElkNode {
  nodeType: 'service';
  display: ServiceDisplay;
}

export interface NetworkGraphNode extends ElkNode {
  nodeType: 'network';
  display: NamedDisplay;
}

export interface VolumeGraphNode extends ElkNode {
  nodeType: 'volume';
  display: NamedDisplay;
}

/** Discriminated by `nodeType`, so checking the type narrows the display data. */
export type StackGraphNode = ServiceGraphNode | NetworkGraphNode | VolumeGraphNode;

export interface StackGraphEdge extends ElkExtendedEdge {
  edgeType: EdgeType;
}

export interface PositionedGraph extends ElkNode {
  children?: StackGraphNode[];
  edges?: StackGraphEdge[];
}
