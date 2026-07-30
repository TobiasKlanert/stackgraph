import yaml from 'js-yaml';
import {
  ServiceNode,
  PortMapping,
  VolumeMount,
  NetworkNode,
  VolumeNode,
  BuildResult,
  ParseResult,
  ParseError,
  CollectResult,
} from '../models/compose.model';

export function parseCompose(source: string): ParseResult {
  let raw: unknown;
  
  try {
    raw = yaml.load(source);
  } catch (error) {
    const parseError: ParseError = {
      message: 'Invalid YAML syntax',
    };
    const errorObj = asRecord(error);

    if (errorObj !== undefined) {
      const errorMessage = asString(errorObj['reason']);
      const markObj = asRecord(errorObj['mark']);

      if (errorMessage !== undefined) {
        parseError.message = errorMessage;
      }

      if (markObj !== undefined) {
        const errorLine = asNumber(markObj['line']);
        if (errorLine !== undefined) {
          parseError.line = errorLine;
        }
      }
    }
    return {
      ok: false,
      errors: [parseError],
    };
  }

  const obj = asRecord(raw);
  if (obj === undefined) {
    return {
      ok: false,
      errors: [{ message: 'The YAML does not describe a Compose file structure.' }],
    };
  }

  const services = asRecord(obj['services']);
  if (services === undefined) {
    return {
      ok: false,
      errors: [{ message: 'The YAML does not contain any services. Nothing can be visualized.' }],
    };
  }

  const networks = asRecord(obj['networks']);
  const volumes = asRecord(obj['volumes']);

  const serviceNodes: ServiceNode[] = [];
  const networkNodes: NetworkNode[] = [];
  const volumeNodes: VolumeNode[] = [];

  const errors: ParseError[] = [];

  const serviceResult = collectNodes(services, buildServiceNode);
  serviceNodes.push(...serviceResult.nodes);
  errors.push(...serviceResult.errors);

  if (networks !== undefined) {
    const networkResult = collectNodes(networks, buildNetworkNode);
    networkNodes.push(...networkResult.nodes);
    errors.push(...networkResult.errors);
  }

  if (volumes !== undefined) {
    const volumeResult = collectNodes(volumes, buildVolumeNode);
    volumeNodes.push(...volumeResult.nodes);
    errors.push(...volumeResult.errors);
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    model: {
      services: serviceNodes,
      networks: networkNodes,
      volumes: volumeNodes,
    },
  };
}

function collectNodes<T>(
  namedObject: Record<string, unknown>,
  build: (key: string, nodeObj: Record<string, unknown> | undefined) => BuildResult<T>
): CollectResult<T> {
  const nodes: T[] = [];
  const errors: ParseError[] = [];

  for (const key of Object.keys(namedObject)) {
    const nodeObj = asRecord(namedObject[key]);
    const buildResult: BuildResult<T> = build(key, nodeObj);

    if (!buildResult.ok) {
      errors.push(buildResult.error);
      continue;
    }

    nodes.push(buildResult.node);
  }

  return {
    nodes,
    errors,
  };
}

function buildServiceNode(
  key: string,
  serviceObj: Record<string, unknown> | undefined
): BuildResult<ServiceNode> {
  if (serviceObj === undefined) {
    return {
      ok: false,
      error: { message: `Service "${key}" is not a valid object.`, path: `services.${key}` },
    };
  }

  const node: ServiceNode = {
    name: key,
    ports: [],
    dependsOn: [],
    networks: [],
    volumes: [],
  };

  const image = asString(serviceObj['image']);
  if (image !== undefined) {
    node.image = image;
  }

  node.ports = parseEntries(asStringArray(serviceObj['ports']), createPortMapping);
  node.dependsOn = asStringArray(serviceObj['depends_on']);
  node.networks = asStringArray(serviceObj['networks']);
  node.volumes = parseEntries(asStringArray(serviceObj['volumes']), createVolumeMount);

  return {
    ok: true,
    node,
  };
}

function buildNetworkNode(
  key: string,
  networkObj: Record<string, unknown> | undefined
): BuildResult<NetworkNode> {
  if (networkObj === undefined) {
    return {
      ok: false,
      error: { message: `Network "${key}" is not a valid object.`, path: `networks.${key}` },
    };
  }

  const node: NetworkNode = {
    name: key,
  };

  const external = asBoolean(networkObj['external']);
  if (external !== undefined) {
    node.external = external;
  }

  const driver = asString(networkObj['driver']);
  if (driver !== undefined) {
    node.driver = driver;
  }

  return {
    ok: true,
    node,
  };
}

function buildVolumeNode(
  key: string,
  volumeObj: Record<string, unknown> | undefined
): BuildResult<VolumeNode> {
  if (volumeObj === undefined) {
    return {
      ok: false,
      error: {
        message: `Volume "${key}" is not a valid object.`,
        path: `volumes.${key}`,
      },
    };
  }

  const node: VolumeNode = {
    name: key,
  };

  const external = asBoolean(volumeObj['external']);
  if (external !== undefined) {
    node.external = external;
  }

  const driver = asString(volumeObj['driver']);
  if (driver !== undefined) {
    node.driver = driver;
  }

  return {
    ok: true,
    node,
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  return undefined;
}

function asStringArray(arr: unknown): string[] {
  if (Array.isArray(arr)) {
    const stringArr: string[] = [];

    for (const entry of arr) {
      const value = asString(entry);
      if (value !== undefined) {
        stringArr.push(value);
      }
    }
    return stringArr;
  }
  return [];
}

function parseEntries<T>(entries: string[], create: (parts: string[]) => T | undefined): T[] {
  const result: T[] = [];

  for (const entry of entries) {
    const parts = entry.split(':');
    const item = create(parts);
    if (item !== undefined) {
      result.push(item);
    }
  }
  return result;
}

function createPortMapping(parts: string[]): PortMapping | undefined {
  const first = parts[0];
  const second = parts[1];

  if (first !== undefined && second !== undefined) {
    const portMapping: PortMapping = {
      host: first,
      container: second,
    };
    return portMapping;
  }

  if (first !== undefined) {
    const portMapping: PortMapping = {
      container: first,
    };
    return portMapping;
  }
  return undefined;
}

function createVolumeMount(parts: string[]): VolumeMount | undefined {
  const first = parts[0];
  const second = parts[1];

  if (first !== undefined && second !== undefined) {
    const volumeMount: VolumeMount = {
      source: first,
      target: second,
      type: determineVolumeType(first),
    };
    return volumeMount;
  }

  if (first !== undefined) {
    const volumeMount: VolumeMount = {
      target: first,
      type: 'volume',
    };
    return volumeMount;
  }
  return undefined;
}

function determineVolumeType(source: string): VolumeMount['type'] {
  if (source.startsWith('.') || source.startsWith('/')) {
    return 'bind';
  }
  return 'volume';
}
