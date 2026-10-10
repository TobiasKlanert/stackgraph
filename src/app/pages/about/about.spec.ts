import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ComposeState } from '../../core/state/compose-state';
import { ConstraintId, constraintTitles } from './about-constraints';
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

  it('gives every constraint a focusable anchor with the title the cards use', () => {
    const rows = Array.from(el.querySelectorAll('#constraints app-spec-item'));

    expect(rows.map((r) => r.id)).toEqual(Object.keys(constraintTitles));
    for (const row of rows) {
      expect(row.getAttribute('tabindex'), row.id).toBe('-1');
      expect(row.querySelector('h3')?.textContent, row.id).toBe(
        constraintTitles[row.id as ConstraintId]
      );
    }
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

  it('links every decision card only to anchors that exist on the page', () => {
    const targets = Array.from(el.querySelectorAll<HTMLAnchorElement>('app-decision-card a')).map(
      (a) => a.getAttribute('href')?.split('#')[1] ?? ''
    );

    expect(targets.length).toBeGreaterThan(0);
    for (const id of targets) {
      expect(el.querySelector(`#${id}`), id).not.toBeNull();
    }
  });

  it('gives every decision card a decision and a cost', () => {
    const cards = Array.from(el.querySelectorAll('app-decision-card'));

    expect(cards).toHaveLength(4);
    for (const card of cards) {
      const blocks = Array.from(card.querySelectorAll('p > strong')).map((b) => b.textContent);

      expect(blocks, card.querySelector('h3')?.textContent ?? '').toContain('Decision.');
      expect(blocks, card.querySelector('h3')?.textContent ?? '').toContain('Cost.');
    }
  });

  it('keeps table semantics explicit, so the mobile card layout cannot drop them', () => {
    const tables = Array.from(el.querySelectorAll<HTMLTableElement>('#stack table'));

    expect(tables).toHaveLength(2);
    for (const table of tables) {
      expect(table.getAttribute('role')).toBe('table');
      expect(table.querySelectorAll('th[scope="col"][role="columnheader"]')).toHaveLength(3);
      for (const row of Array.from(table.tBodies[0]?.rows ?? [])) {
        const labels = Array.from(row.cells).map((c) => c.dataset['label'] ?? null);

        expect(labels).toEqual([null, 'Where', 'Why']);
        expect(Array.from(row.cells).every((c) => c.getAttribute('role') === 'cell')).toBe(true);
      }
    }
  });

  it('names a WCAG criterion for every accessibility point', () => {
    const tags = Array.from(el.querySelectorAll('#accessibility app-spec-item .tag')).map(
      (t) => t.textContent
    );

    expect(tags).toHaveLength(5);
    expect(tags.every((t) => t?.startsWith('WCAG '))).toBe(true);
  });
});
