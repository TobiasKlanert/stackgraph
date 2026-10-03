import { ComposeModel } from '../models/compose.model';

/**
 * Reverse lookups over the compose model. The model stores every relation on
 * the service side only (`dependsOn`, `networks`, `volumes`); the panels also
 * need the other direction. Results keep the file order of the services.
 */

/** Services whose `depends_on` names the given service. */
export function requiredBy(model: ComposeModel, serviceName: string): string[] {
  return model.services.filter((s) => s.dependsOn.includes(serviceName)).map((s) => s.name);
}

/** Services attached to the given network. */
export function servicesOnNetwork(model: ComposeModel, networkName: string): string[] {
  return model.services.filter((s) => s.networks.includes(networkName)).map((s) => s.name);
}

/** Services mounting the given named volume. Bind mounts never match. */
export function servicesUsingVolume(model: ComposeModel, volumeName: string): string[] {
  return model.services
    .filter((s) => s.volumes.some((v) => v.type === 'volume' && v.source === volumeName))
    .map((s) => s.name);
}
