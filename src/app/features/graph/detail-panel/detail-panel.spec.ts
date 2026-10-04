import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailPanel } from './detail-panel';
import { ComposeModel, ServiceNode } from '../../../core/models/compose.model';

function service(name: string, overrides: Partial<ServiceNode> = {}): ServiceNode {
  return { name, ports: [], dependsOn: [], networks: [], volumes: [], ...overrides };
}

const api = service('api', {
  image: 'ghcr.io/acme/api:2.1.1',
  ports: [{ host: '8080', container: '80' }, { container: '9000' }],
  networks: ['edge', 'backend'],
  volumes: [
    { source: 'uploads', target: '/srv/uploads', type: 'volume' },
    { source: './config', target: '/etc/api', type: 'bind' },
    { target: '/tmp/cache', type: 'volume' },
  ],
  dependsOn: ['db', 'ghost'],
});

const model: ComposeModel = {
  services: [service('web', { dependsOn: ['api'] }), api, service('db')],
  networks: [{ name: 'edge' }, { name: 'backend' }],
  volumes: [{ name: 'uploads' }],
};

describe('DetailPanel', () => {
  let fixture: ComponentFixture<DetailPanel>;
  let host: HTMLElement;
  let selected: string[];
  let closedCount: number;

  async function show(s: ServiceNode): Promise<void> {
    fixture.componentRef.setInput('service', s);
    await fixture.whenStable();
  }

  /** The <dd> of the group whose label starts with the given text. */
  function group(label: string): HTMLElement {
    const fact = Array.from(host.querySelectorAll<HTMLElement>('.fact')).find((f) =>
      f.querySelector('dt')?.textContent?.trim().startsWith(label)
    );
    const dd = fact?.querySelector<HTMLElement>('dd');
    if (!dd) {
      throw new Error(`No group "${label}"`);
    }
    return dd;
  }

  function text(el: Element | null | undefined): string {
    return el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  beforeEach(async () => {
    selected = [];
    closedCount = 0;
    fixture = TestBed.createComponent(DetailPanel);
    host = fixture.nativeElement;
    fixture.componentRef.setInput('model', model);
    fixture.componentInstance.serviceSelected.subscribe((name) => selected.push(name));
    fixture.componentInstance.closed.subscribe(() => closedCount++);
    await show(api);
  });

  it('names the service in a heading that can take focus', () => {
    const heading = host.querySelector('h2');

    expect(text(heading)).toBe('api');
    expect(heading?.getAttribute('tabindex')).toBe('-1');
    expect(host.querySelector('section')?.getAttribute('aria-labelledby')).toBe(heading?.id);
  });

  it('shows the image, or "local build" without one', async () => {
    expect(text(group('Image'))).toBe('ghcr.io/acme/api:2.1.1');

    await show(service('worker'));

    expect(text(group('Image'))).toBe('local build');
  });

  it('shows ports as host → container and spells them out for screen readers', () => {
    const chips = group('Ports').querySelectorAll('.chip');

    expect(chips).toHaveLength(2);
    expect(text(chips[0]?.querySelector('[aria-hidden="true"]'))).toBe('8080 → 80');
    expect(text(chips[0]?.querySelector('.sr-only'))).toBe('Host port 8080 to container port 80');
    expect(text(chips[1]?.querySelector('[aria-hidden="true"]'))).toBe('9000');
  });

  it('counts the entries of each group', () => {
    const count = (label: string) => text(group(label).parentElement?.querySelector('dt .count'));

    expect(count('Ports')).toBe('2');
    expect(count('Networks')).toBe('2');
    expect(count('Volumes')).toBe('3');
    expect(count('Depends on')).toBe('2');
    expect(count('Required by')).toBe('1');
  });

  it('lists networks, or the default network without any', async () => {
    const items = Array.from(group('Networks').querySelectorAll('li')).map(text);
    expect(items).toEqual(['edge', 'backend']);

    await show(service('worker'));

    expect(text(group('Networks'))).toBe('Default network');
  });

  it('lists named, bind and anonymous mounts with their target', () => {
    const rows = Array.from(group('Volumes').querySelectorAll('li')).map(text);

    expect(rows).toEqual([
      'uploads mounted at → /srv/uploads',
      './config mounted at → /etc/api bind',
      'anonymous mounted at → /tmp/cache',
    ]);
    expect(group('Volumes').querySelector('app-type-icon[data-kind="bind"]')).not.toBeNull();
  });

  it('selects a dependency from its button', () => {
    const button = group('Depends on').querySelector('button');

    expect(text(button)).toBe('db');
    button?.click();

    expect(selected).toEqual(['db']);
  });

  it('shows a dependency the file does not define, but not as a button', () => {
    const dd = group('Depends on');

    expect(dd.querySelectorAll('button')).toHaveLength(1);
    expect(text(dd)).toContain('ghost (not defined)');
  });

  it('lists the services that require this one as buttons', () => {
    const button = group('Required by').querySelector('button');

    expect(text(button)).toBe('web');
    button?.click();

    expect(selected).toEqual(['web']);
  });

  it('says "None" for empty relations', async () => {
    await show(service('worker'));

    expect(text(group('Ports'))).toBe('None');
    expect(text(group('Volumes'))).toBe('None');
    expect(text(group('Depends on'))).toBe('None');
    expect(text(group('Required by'))).toBe('None');
    expect(group('Ports').parentElement?.querySelector('.count')).toBeNull();
  });

  it('closes from its button and with Escape', () => {
    host.querySelector<HTMLButtonElement>('button[aria-label="Close details"]')?.click();
    host
      .querySelector('h2')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closedCount).toBe(2);
  });

  it('moves focus to its heading on request', () => {
    fixture.componentInstance.focusHeading();

    expect(document.activeElement).toBe(host.querySelector('h2'));
  });
});
