import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { SiteFooter } from './site-footer';

/** Routed page that renders the footer, so RouterLinkActive sees a real URL. */
@Component({ imports: [SiteFooter], template: '<app-site-footer />' })
class Page {}

describe('SiteFooter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Page }])],
    });
  });

  function render(tagline?: string): HTMLElement {
    const fixture = TestBed.createComponent(SiteFooter);
    if (tagline !== undefined) {
      fixture.componentRef.setInput('tagline', tagline);
    }
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('shows the privacy note by default', () => {
    expect(render().querySelector('.tagline')?.textContent).toBe(
      'Runs in your browser. Nothing is uploaded.'
    );
  });

  it('accepts a different tagline', () => {
    expect(render('A portfolio project').querySelector('.tagline')?.textContent).toBe(
      'A portfolio project'
    );
  });

  it('announces that external links open a new tab', () => {
    const external = Array.from(render().querySelectorAll('a[target="_blank"]'));

    expect(external.length).toBe(2);
    for (const link of external) {
      expect(link.textContent).toContain('(opens in a new tab)');
    }
  });

  it('marks the link to the current page', async () => {
    const harness = await RouterTestingHarness.create('/about');
    const el: HTMLElement = harness.routeNativeElement as HTMLElement;

    expect(el.querySelector('a[href="/about"]')?.getAttribute('aria-current')).toBe('page');
    expect(el.querySelector('a[href="/imprint"]')?.hasAttribute('aria-current')).toBe(false);
  });
});
