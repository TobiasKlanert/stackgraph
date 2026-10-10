import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ComposeState } from '../../core/state/compose-state';
import { About, aboutSections } from './about';

describe('About', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'about', component: About }]),
        // The hero reads the editor text; the real pipeline is not needed here.
        { provide: ComposeState, useValue: { source: signal('') } },
      ],
    });
    const harness = await RouterTestingHarness.create('/about');
    el = harness.routeNativeElement as HTMLElement;
  });

  const tocLinks = () => Array.from(el.querySelectorAll<HTMLAnchorElement>('nav.toc a'));

  it('has one page title, in the hero', () => {
    const titles = el.querySelectorAll('h1');

    expect(titles).toHaveLength(1);
    expect(titles[0]?.closest('app-about-hero')).not.toBeNull();
  });

  it('builds the table of contents from the section list, in page order', () => {
    expect(tocLinks().map((a) => a.textContent?.trim())).toEqual(aboutSections.map((s) => s.title));
  });

  it('labels the table of contents as its own navigation', () => {
    const nav = el.querySelector('nav.toc');
    const labelId = nav?.getAttribute('aria-labelledby') ?? '';

    expect(el.querySelector(`#${labelId}`)?.textContent?.trim()).toBe('On this page');
  });

  it('links every entry through the router to the current page, not to "/#…"', () => {
    expect(tocLinks().map((a) => a.getAttribute('href'))).toEqual(
      aboutSections.map((s) => `/about#${s.id}`)
    );
  });

  it('has a focusable section for every entry, headed by the same title', () => {
    for (const { id, title } of aboutSections) {
      const section = el.querySelector(`section#${id}`);

      expect(section, id).not.toBeNull();
      expect(section?.getAttribute('tabindex'), id).toBe('-1');
      expect(section?.querySelector('h2')?.textContent?.trim(), id).toBe(title);
    }
  });

  it('has no section that is missing from the table of contents', () => {
    const ids = Array.from(el.querySelectorAll('section[id]')).map((s) => s.id);

    expect(ids).toEqual(aboutSections.map((s) => s.id));
  });

  it('gives every constraint a focusable anchor for the decision cards', () => {
    const specs = Array.from(el.querySelectorAll('#constraints .spec'));

    expect(specs.map((s) => s.id)).toEqual([
      'c-browser',
      'c-feedback',
      'c-errors',
      'c-direction',
      'c-a11y',
    ]);
    expect(specs.every((s) => s.getAttribute('tabindex') === '-1')).toBe(true);
  });

  it('lists the pipeline steps in order', () => {
    const titles = Array.from(el.querySelectorAll('#how-it-works ol.steps h3')).map((h) =>
      h.textContent?.trim()
    );

    expect(titles).toEqual([
      'Wait for a pause',
      'Parse into a typed model',
      'Compute the layout',
      'Draw the graph',
      'Keep the last good graph',
    ]);
  });
});
