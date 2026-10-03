import { PortMapping } from '../models/compose.model';

/** "8080:80/udp" style label, shared by the graph and the detail panel. */
export function formatPort(port: PortMapping): string {
  if (!port.host) {
    return port.container;
  }
  if (!port.protocol) {
    return `${port.host}:${port.container}`;
  }
  return `${port.host}:${port.container}/${port.protocol}`;
}

/** Spoken form of a port mapping for screen readers, where "8080 → 80" says little. */
export function describePort(port: PortMapping): string {
  const protocol = port.protocol === 'udp' ? ', UDP' : '';
  if (!port.host) {
    return `Container port ${port.container} on a random host port${protocol}`;
  }
  return `Host port ${port.host} to container port ${port.container}${protocol}`;
}
