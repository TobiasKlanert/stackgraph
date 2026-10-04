import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StackOverview } from './stack-overview';
import { ComposeModel, ServiceNode } from '../../../core/models/compose.model';

function service(name: string, overrides: Partial<ServiceNode> = {}): ServiceNode {
  return { name, ports: [], dependsOn: [], networks: [], volumes: [], ...overrides };
}

const model: ComposeModel = {
  services: [
    service('web', {
      image: 'nginx:alpine',
      ports: [
        { host: '80', container: '80' },
        { host: '443', container: '443' },
      ],
      networks: ['edge'],
    }),
    service('worker', { ports: [{ container: '9000' }], networks: ['edge'] }),
    service('db', {
      image: 'postgres:16',
      volumes: [{ source: 'pgdata', target: '/var/lib/postgresql/data', type: 'volume' }],
    }),
  ],
  networks: [{ name: 'edge' }, { name: 'spare' }],
  volumes: [{ name: 'pgdata' }],
};

describe('StackOverview', () => {
  let fixture: ComponentFixture<StackOverview>;
  let host: HTMLElement;
  let selected: string[];

  /** Text as a screen reader would join it; template line breaks are not content. */
  function text(el: Element | null | undefined): string {
    return el?.textContent?.replace(/\s+/g, ' ').replace(/ ,/g, ',').trim() ?? '';
  }

  function group(heading: string): HTMLElement | undefined {
    return Array.from(host.querySelectorAll<HTMLElement>('.group')).find((g) =>
      text(g.querySelector('h3')).startsWith(heading)
    );
  }

  async function render(m: ComposeModel): Promise<void> {
    fixture.componentRef.setInput('model', m);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    selected = [];
    fixture = TestBed.createComponent(StackOverview);
    host = fixture.nativeElement;
    fixture.componentInstance.serviceSelected.subscribe((name) => selected.push(name));
    await render(model);
  });

  it('has a focusable heading that names the region', () => {
    const heading = host.querySelector('h2');

    expect(text(heading)).toBe('Stack overview');
    expect(heading?.getAttribute('tabindex')).toBe('-1');
    expect(host.querySelector('section')?.getAttribute('aria-labelledby')).toBe(heading?.id);
  });

  it('lists every service as a button with image and fixed host ports', () => {
    const buttons = group('Services')?.querySelectorAll('button') ?? [];

    expect(text(group('Services')?.querySelector('h3'))).toBe('Services 3');
    expect(Array.from(buttons).map(text)).toEqual([
      'web, nginx:alpine, ports 80, 443',
      'worker, local build',
      'db, postgres:16',
    ]);
  });

  it('selects a service from its button', () => {
    group('Services')?.querySelectorAll('button')[2]?.click();

    expect(selected).toEqual(['db']);
  });

  it('lists networks with the services attached to them', () => {
    const rows = Array.from(group('Networks')?.querySelectorAll('li') ?? []).map(text);

    expect(rows).toEqual(['edge, services: web, worker', 'spare, unused']);
  });

  it('lists volumes with the services using them', () => {
    const rows = Array.from(group('Volumes')?.querySelectorAll('li') ?? []).map(text);

    expect(rows).toEqual(['pgdata, used by db']);
  });

  it('leaves out empty network and volume groups', async () => {
    await render({ services: [service('solo')], networks: [], volumes: [] });

    expect(group('Networks')).toBeUndefined();
    expect(group('Volumes')).toBeUndefined();
  });

  it('moves focus to its heading on request', () => {
    fixture.componentInstance.focusHeading();

    expect(document.activeElement).toBe(host.querySelector('h2'));
  });
});
