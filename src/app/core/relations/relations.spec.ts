import { ComposeModel, ServiceNode } from '../models/compose.model';
import { requiredBy } from './relations';

function service(name: string, overrides: Partial<ServiceNode> = {}): ServiceNode {
  return { name, ports: [], dependsOn: [], networks: [], volumes: [], ...overrides };
}

const model: ComposeModel = {
  services: [
    service('web', { dependsOn: ['api'], networks: ['edge'] }),
    service('api', {
      dependsOn: ['db'],
      networks: ['edge', 'backend'],
      volumes: [{ source: './uploads', target: '/srv/uploads', type: 'bind' }],
    }),
    service('worker', { dependsOn: ['api', 'db'], networks: ['backend'] }),
    service('db', {
      networks: ['backend'],
      volumes: [{ source: 'pgdata', target: '/var/lib/postgresql/data', type: 'volume' }],
    }),
  ],
  networks: [{ name: 'edge' }, { name: 'backend' }],
  volumes: [{ name: 'pgdata' }, { name: 'unused' }],
};

describe('requiredBy', () => {
  it('lists the services that depend on a service, in file order', () => {
    expect(requiredBy(model, 'api')).toEqual(['web', 'worker']);
  });

  it('is empty for a service nothing depends on', () => {
    expect(requiredBy(model, 'web')).toEqual([]);
  });
});
