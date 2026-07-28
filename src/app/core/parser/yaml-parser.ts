import yaml from 'js-yaml';
import {
  ServiceNode,
  PortMapping,
  VolumeMount,
  NetworkNode,
  ParseResult,
  VolumeNode,
} from '../models/compose.model';

const source = `
services:
  app:
    container_name: stackgraph
    image: ghcr.io/tobiasklanert/stackgraph:latest
    ports:
      - "8080:80"
      - "443"
    networks:
      - web
    depends_on:
      - data
    volumes:
      - "./data:/app/data"         
      - "named-volume:/var/lib/db"              
    restart: unless-stopped
  data:
    container_name: database
    image: database:latest
    ports:
      - "8080:80"
    networks:
      - web
    depends_on:
      - app
    volumes:
      - "./data:/app/data"         
    restart: unless-stopped

networks:
  web:
    external: true

volumes:
  database:
    driver: testdriver
`;

export function parseCompose(source: string): ParseResult {
  const raw = yaml.load(source);

  const obj = asRecord(raw);
  if (obj === undefined) {
    return {
      ok: false,
      errors: [{ message: 'obj is undefined' }],
    };
  }

  const services = asRecord(obj['services']);
  if (services === undefined) {
    return {
      ok: false,
      errors: [{ message: 'services is undefined' }],
    };
  }

  const networks = asRecord(obj['networks']);
  const volumes = asRecord(obj['volumes']);

  const serviceNodes: ServiceNode[] = [];
  const networkNodes: NetworkNode[] = [];
  const volumeNodes: VolumeNode[] = [];

  for (const key of Object.keys(services)) {
    const serviceObj = asRecord(services[key]);
    if (serviceObj === undefined) {
      continue;
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

    serviceNodes.push(node);
  }

  if (networks !== undefined) {
    for (const key of Object.keys(networks)) {
      const networkObj = asRecord(networks[key]);
      if (networkObj === undefined) {
        continue;
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

      networkNodes.push(node);
    }
  }

  if (volumes !== undefined) {
    for (const key of Object.keys(volumes)) {
      const volumeObj = asRecord(volumes[key]);
      if (volumeObj === undefined) {
        continue;
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

      volumeNodes.push(node);
    }
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

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  return undefined;
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

console.log(parseCompose(source));
