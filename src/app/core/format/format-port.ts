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
