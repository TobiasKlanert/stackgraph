import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { externalLinks } from '../../../core/config/external-links';
import { sampleCompose } from '../../../core/samples/sample-compose';
import { ComposeState } from '../../../core/state/compose-state';
import { WorkspaceView } from '../../../core/state/workspace-view';
import { AboutHero } from './about-hero';

@Component({ template: '' })
class Start {}

describe('AboutHero', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;
  // Only the text matters here; the real pipeline would parse and lay out.
  const source = signal('');

  async function render(initialSource = ''): Promise<void> {
    source.set(initialSource);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Start },
          { path: 'about', component: AboutHero },
        ]),
        { provide: ComposeState, useValue: { source } },
      ],
    });
    harness = await RouterTestingHarness.create('/about');
    el = harness.routeNativeElement as HTMLElement;
  }

  const primary = () => el.querySelector<HTMLAnchorElement>('[data-testid="hero-primary"]');

  it('has the page title', async () => {
    await render();

    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Building StackGraph');
  });

  it('opens the source code in a new tab and says so', async () => {
    await render();
    const github = el.querySelector<HTMLAnchorElement>(
      `.actions a[href="${externalLinks.github}"]`
    );

    expect(github?.getAttribute('target')).toBe('_blank');
    expect(github?.getAttribute('rel')).toBe('noopener');
    expect(github?.textContent).toContain('opens in a new tab');
  });

  describe('main button with an empty editor', () => {
    beforeEach(() => render());

    it('offers the example', () => {
      expect(primary()?.textContent?.trim()).toBe('Try it with an example');
    });

    it('loads the example, opens the graph view and goes to the start page', async () => {
      primary()?.click();
      await harness.fixture.whenStable();

      expect(source()).toBe(sampleCompose);
      expect(TestBed.inject(WorkspaceView).isOpen()).toBe(true);
      expect(TestBed.inject(Router).url).toBe('/');
    });

    it('leaves this tab alone on a modified click', () => {
      primary()?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })
      );

      expect(source()).toBe('');
      expect(TestBed.inject(WorkspaceView).isOpen()).toBe(false);
    });
  });

  describe('main button when the editor holds the visitor’s own file', () => {
    const own = 'services:\n  web:\n    image: nginx\n';

    beforeEach(() => render(own));

    it('leads back to the app instead', () => {
      expect(primary()?.textContent?.trim()).toBe('Back to the app');
    });

    it('does not load the example over the file', async () => {
      primary()?.click();
      await harness.fixture.whenStable();

      expect(source()).toBe(own);
      expect(TestBed.inject(Router).url).toBe('/');
    });
  });
});
