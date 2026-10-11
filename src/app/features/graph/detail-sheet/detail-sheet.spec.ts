import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailSheet } from './detail-sheet';

/** Projects content and binds `expanded` two-way, as the graph page does. */
@Component({
  imports: [DetailSheet],
  template: `
    <app-detail-sheet [compact]="compact()" [name]="name()" [kind]="kind()" [(expanded)]="expanded">
      <p class="projected">Details</p>
    </app-detail-sheet>
  `,
})
class Host {
  readonly compact = signal(true);
  readonly name = signal('Stack overview');
  readonly kind = signal<string | undefined>(undefined);
  readonly expanded = signal(false);
}

describe('DetailSheet', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  function sheet(): HTMLElement {
    return fixture.nativeElement.querySelector('app-detail-sheet');
  }

  function handle(): HTMLButtonElement | null {
    return sheet().querySelector('.handle');
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('projects its content', () => {
    expect(sheet().querySelector('.projected')?.textContent).toBe('Details');
  });

  it('has no handle outside the compact layout', async () => {
    host.compact.set(false);
    await fixture.whenStable();

    expect(handle()).toBeNull();
    expect(sheet().querySelector('.projected')).not.toBeNull();
  });

  it('names what it holds on the handle, with the kind first', async () => {
    expect(handle()?.textContent?.trim()).toBe('Stack overview');

    host.name.set('api');
    host.kind.set('Service');
    await fixture.whenStable();

    expect(handle()?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Service api');
  });

  it('points the handle at the content it shows and hides', () => {
    const id = handle()?.getAttribute('aria-controls') ?? '';

    expect(sheet().querySelector(`#${id} .projected`)).not.toBeNull();
  });

  it('opens and closes with the handle and reports it to the page', async () => {
    expect(handle()?.getAttribute('aria-expanded')).toBe('false');
    expect(sheet().dataset['sheet']).toBe('collapsed');

    handle()?.click();
    await fixture.whenStable();

    expect(host.expanded()).toBe(true);
    expect(handle()?.getAttribute('aria-expanded')).toBe('true');
    expect(sheet().dataset['sheet']).toBe('expanded');

    handle()?.click();
    await fixture.whenStable();

    expect(host.expanded()).toBe(false);
  });

  it('follows the page when it opens the sheet', async () => {
    host.expanded.set(true);
    await fixture.whenStable();

    expect(handle()?.getAttribute('aria-expanded')).toBe('true');
  });
});
