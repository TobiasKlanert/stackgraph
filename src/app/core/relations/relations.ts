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
