import yaml from 'js-yaml';
import { ServiceNode } from '../models/compose.model';

const source = `
services:
  app:
    container_name: stackgraph
    image: ghcr.io/tobiasklanert/stackgraph:latest
    networks:
      - web
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

parseCompose(source);
