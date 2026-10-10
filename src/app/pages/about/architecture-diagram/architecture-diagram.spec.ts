import { TestBed } from '@angular/core/testing';
import * as svgExport from '../../../core/export/svg-export';
import * as composeToElk from '../../../core/layout/compose-to-elk';
import * as layout from '../../../core/layout/layout';
import * as yamlParser from '../../../core/parser/yaml-parser';
import * as composeState from '../../../core/state/compose-state';
import * as detailPanel from '../../../features/graph/detail-panel/detail-panel';
import * as editor from '../../../features/graph/editor/editor';
import * as graphPage from '../../../features/graph/graph-page/graph-page';
import * as home from '../../../features/graph/home/home';
import * as rendering from '../../../features/graph/rendering/rendering';
import * as stackOverview from '../../../features/graph/stack-overview/stack-overview';
import * as zoomable from '../../../shared/directives/zoomable';
import { ArchitectureDiagram } from './architecture-diagram';
import { architectureLayers } from './architecture-layers';

/**
 * Everything the diagram may name. A rename in the code, even through the
 * IDE, updates the imports here but not the strings in the diagram, so this
 * test fails until the diagram follows.
 */
const codeExports: Record<string, unknown> = {
  ...graphPage,
  ...home,
  ...editor,
  ...rendering,
  ...zoomable,
  ...detailPanel,
  ...stackOverview,
  ...composeState,
  ...yamlParser,
  ...composeToElk,
  ...layout,
  ...svgExport,
};

const items = architectureLayers.flatMap((layer) => layer.rows.flatMap((row) => row.items));

describe('architectureLayers', () => {
  it('names only functions and classes that exist in the code', () => {
    const symbols = items.filter((i) => i.kind === 'symbol').map((i) => i.name);

    expect(symbols.length).toBeGreaterThan(10);
    for (const name of symbols) {
      expect(codeExports, name).toHaveProperty(name);
    }
  });

  it('names each item only once', () => {
    const names = items.map((i) => i.name);

    expect(new Set(names).size).toBe(names.length);
  });
});

describe('ArchitectureDiagram', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(ArchitectureDiagram);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('draws the layers from top to bottom', () => {
    const names = Array.from(el.querySelectorAll('.layer .name')).map((n) => n.textContent);

    expect(names).toEqual(['Components', 'State', 'Pipeline', 'Model']);
  });

  it('shows code names as code and file groups as plain words', () => {
    const code = Array.from(el.querySelectorAll('code.item')).map((c) => c.textContent);
    const words = Array.from(el.querySelectorAll('.item-text')).map((w) => w.textContent);

    expect(code).toContain('parseCompose');
    expect(code).toContain('ComposeModel');
    expect(words).toContain('node geometry');
  });

  it('separates items and notes with invisible punctuation for screen readers', () => {
    const pipelineRow = el.querySelectorAll('.layer')[2]?.querySelector('.row');
    const hidden = Array.from(pipelineRow?.querySelectorAll('.sr-only') ?? []).map(
      (s) => s.textContent
    );

    // Four commas between five items, a colon before the note.
    expect(hidden).toEqual([', ', ', ', ', ', ', ', ': ']);
  });

  it('explains the arrows in the caption', () => {
    expect(el.querySelector('figcaption')?.textContent).toContain('depends on');
  });
});
