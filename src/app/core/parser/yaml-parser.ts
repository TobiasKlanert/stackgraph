import yaml from 'js-yaml';
import { ServiceNode, PortMapping } from '../models/compose.model';

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
  console.log("Ganzes Objekt: ", obj);
  
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

    const ports = serviceObj['ports'];
    if (Array.isArray(ports)) {
      for (const entry of ports) {
        const portString = asString(entry);
        if (portString !== undefined) {
          const parts = portString.split(':');
          const portMapping = getPortMapping(parts);
          if (portMapping !== undefined) {
            node.ports.push(portMapping);
          }
        }
      }
    }

    const networks = serviceObj['networks'];
    if (Array.isArray(networks)) {
      for (const entry of networks) {
        const networkName = asString(entry);
        if (networkName !== undefined) {
          node.networks.push(networkName);
        }
      }
    }

    const dependsOn = serviceObj['depends_on'];
    if (Array.isArray(dependsOn)) {
      for (const entry of dependsOn) {
        const dependency = asString(entry);
        if (dependency !== undefined) {
          node.dependsOn.push(dependency);
        }
      }
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

function getPortMapping(parts: string[]): PortMapping | undefined {
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

parseCompose(source);
