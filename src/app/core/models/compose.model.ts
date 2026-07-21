/**
 * Internal, typed representation of a parsed docker-compose file.
 *
 * Scope note: this models only what the graph and detail panel need,
 * not the full compose spec.
 */

/** A single host:container port mapping, e.g. "8080:80/tcp". */
export interface PortMapping {
  /** Host-side port, e.g. "8080". Absent in the short form (e.g. just "80"). */
  host?: string;
  /** Container-side port, e.g. "80". Always present. */
  container: string;
  /** Protocol. Absent means compose's default (tcp). */
  protocol?: 'tcp' | 'udp';
}

/** How a service mounts a volume or host path. */
export interface VolumeMount {
  /** Named volume name (→ links to a volume node) or a host path (bind mount). */
  source: string;
  /** Mount path inside the container, e.g. "/var/lib/data". */
  target: string;
  /** Mirrors compose's long-form `type:` key: a declared volume vs a bind mount. */
  type: 'volume' | 'bind';
}

/** A service under the top-level `services:` key. Becomes a graph node. */
export interface ServiceNode {
  /** The service key, e.g. "api". Unique within the file. */
  name: string;
  /** The `image:` value, e.g. "nginx:alpine". Absent if the service only has `build:`. */
  image?: string;
  /** Port mappings. Empty array if none declared. */
  ports: PortMapping[];
  /** Names of services this one depends on. Source of the directed edges. */
  dependsOn: string[];
  /** Names of networks this service is attached to. */
  networks: string[];
  /** Volume mounts of this service. */
  volumes: VolumeMount[];
}

/** A network under the top-level `networks:` key. Its own node/group type. */
export interface NetworkNode {
  /** The network key, e.g. "backend". */
  name: string;
  /** Declared `external: true` — managed outside this compose file. */
  external?: boolean;
  /** The network driver, e.g. "bridge". */
  driver?: string;
}

/** A named volume under the top-level `volumes:` key. Its own node/group type. */
export interface VolumeNode {
  /** The volume key, e.g. "db-data". */
  name: string;
  /** Declared `external: true`. */
  external?: boolean;
  /** The volume driver, e.g. "local". */
  driver?: string;
}

/**
 * The root model: the whole parsed compose file as StackGraph sees it.
 * Collections are always present (empty arrays when nothing is declared),
 * so consumers never need null checks.
 */
export interface ComposeModel {
  services: ServiceNode[];
  networks: NetworkNode[];
  volumes: VolumeNode[];
}
