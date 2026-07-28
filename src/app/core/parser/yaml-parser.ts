import yaml from 'js-yaml';
import { ServiceNode, PortMapping, VolumeMount } from '../models/compose.model';

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
      - networks
    volumes:
      - "./data:/app/data"         
      - "named-volume:/var/lib/db"              
    restart: unless-stopped

networks:
  web:
    external: true
`;

export function parseCompose(source: string) {
  const raw = yaml.load(source);

  const obj = asRecord(raw);
  if (obj === undefined) {
    console.log('obj is undefined');
    return;
  }

  const services = asRecord(obj['services']);
  if (services === undefined) {
    console.log('services is undefined');
    return;
  }

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

    console.log('Service Node: ', node);
  }
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

parseCompose(source);
