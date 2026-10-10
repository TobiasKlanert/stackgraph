import { ViewportScroller } from '@angular/common';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';
import { THEME_STORAGE } from './core/theme/theme';

/**
 * Scrolling behaviour of the real router configuration. The app is
 * bootstrapped for real, because the router only starts its scroll handling
 * in the bootstrap listener; TestBed.createComponent would never get there.
 * The viewport scroller is replaced by spies, since jsdom does not scroll.
 */
describe('appConfig scrolling', () => {
  let host: HTMLElement;
  let scroller: ViewportScroller;
  let router: Router;

  beforeEach(async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: THEME_STORAGE, useValue: null }],
    });
    scroller = TestBed.inject(ViewportScroller);
    vi.spyOn(scroller, 'scrollToAnchor').mockImplementation(() => undefined);
    vi.spyOn(scroller, 'scrollToPosition').mockImplementation(() => undefined);

    host = document.createElement('app-root');
    document.body.appendChild(host);
    const appRef = TestBed.inject(ApplicationRef);
    appRef.bootstrap(App, host);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/about');
    await appRef.whenStable();
  });

  afterEach(() => {
    host.remove();
    vi.unstubAllGlobals();
  });

  it('scrolls to the section a table-of-contents link points to', async () => {
    host.querySelector<HTMLAnchorElement>('nav.toc a[href="/about#architecture"]')?.click();

    await vi.waitFor(() => expect(scroller.scrollToAnchor).toHaveBeenCalledWith('architecture'));
  });

  it('opens a newly visited page at the top', async () => {
    vi.mocked(scroller.scrollToPosition).mockClear();

    await router.navigateByUrl('/imprint');

    await vi.waitFor(() => expect(scroller.scrollToPosition).toHaveBeenCalledWith([0, 0]));
  });
});
