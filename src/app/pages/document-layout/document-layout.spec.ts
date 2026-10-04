import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DocumentLayout } from './document-layout';

@Component({ template: '<h1>Page content</h1>' })
class Page {}

describe('DocumentLayout', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: DocumentLayout, children: [{ path: 'about', component: Page }] },
        ]),
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('frames the routed page with header, main landmark and footer', async () => {
    const harness = await RouterTestingHarness.create('/about');
    const el = harness.routeNativeElement as HTMLElement;

    expect(el.querySelector('app-site-header')).not.toBeNull();
    expect(el.querySelector('main h1')?.textContent).toBe('Page content');
    expect(el.querySelector('app-site-footer')).not.toBeNull();
  });

  it('links back to the app', async () => {
    const harness = await RouterTestingHarness.create('/about');
    const el = harness.routeNativeElement as HTMLElement;
    const back = el.querySelector('nav[aria-label="Main"] a');

    expect(back?.getAttribute('href')).toBe('/');
    expect(back?.textContent?.trim()).toBe('Back to the app');
  });
});
