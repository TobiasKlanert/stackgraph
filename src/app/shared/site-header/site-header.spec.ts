import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkspaceView } from '../../core/state/workspace-view';
import { SiteHeader } from './site-header';

@Component({
  imports: [SiteHeader],
  template: `
    <app-site-header>
      <span siteHeaderStart data-testid="start">docker-compose.yml</span>
      <button type="button" data-testid="action">Export</button>
    </app-site-header>
  `,
})
class Host {}

describe('SiteHeader', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const workspace = TestBed.inject(WorkspaceView);
    workspace.open();

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const brand = el.querySelector<HTMLAnchorElement>('a.brand');
    if (brand === null) {
      throw new Error('brand link missing');
    }
    return { el, brand, workspace };
  }

  function click(target: HTMLElement, init: MouseEventInit = {}): void {
    target.dispatchEvent(
      new MouseEvent('click', { button: 0, bubbles: true, cancelable: true, ...init })
    );
  }

  it('links the brand to the start page', () => {
    const { brand } = setup();

    expect(brand.getAttribute('href')).toBe('/');
    expect(brand.textContent?.trim()).toBe('StackGraph');
  });

  it('projects start and end content into their slots', () => {
    const { el } = setup();

    expect(el.querySelector('.start [data-testid="start"]')).not.toBeNull();
    expect(el.querySelector('.end [data-testid="action"]')).not.toBeNull();
  });

  it('closes the split view on a plain click on the brand', () => {
    const { brand, workspace } = setup();

    click(brand);

    expect(workspace.isOpen()).toBe(false);
  });

  it('leaves the split view open on modified clicks, which open a new tab', () => {
    const { brand, workspace } = setup();

    click(brand, { ctrlKey: true });

    expect(workspace.isOpen()).toBe(true);
  });
});
