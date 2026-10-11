import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GraphPage } from './graph-page';
import { ComposeState } from '../../../core/state/compose-state';
import { SvgExport } from '../../../core/export/svg-export';
import { FakeMediaQuery } from '../../../../testing/fake-media-query';
import { compactLayoutQuery } from '../compact-layout';

interface DownloadCall {
  svg: SVGSVGElement;
  fileName: string;
}

const yaml = `
services:
  web:
    image: nginx:alpine
    networks:
      - web
    depends_on:
      - api
  api:
    image: node:22-alpine
networks:
  web: {}
`;

describe('GraphPage', () => {
  let fixture: ComponentFixture<GraphPage>;
  let state: ComposeState;
  let downloads: DownloadCall[];
  /** The small-screen query. Wide by default; tests emit true to go compact. */
  let compactQuery: FakeMediaQuery;

  function panel(): HTMLElement | null {
    return fixture.nativeElement.querySelector('app-detail-panel');
  }

  function homeButton(testId: string): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(`app-home [data-testid="${testId}"]`);
  }

  function showButton(): HTMLButtonElement | null {
    return homeButton('show-graph');
  }

  function tryItButton(): HTMLButtonElement | null {
    return homeButton('try-it');
  }

  function clickNode(id: string): void {
    const el = fixture.nativeElement.querySelector(`[data-node-id="${id}"]`);
    expect(el).not.toBeNull();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  /** Renders and polls until the pipeline produced the expected result. */
  async function settleUntil(predicate: () => boolean, timeoutMs = 10_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      await fixture.whenStable();
      if (predicate()) {
        return;
      }
      if (Date.now() > deadline) {
        throw new Error('Timed out waiting for the pipeline to settle');
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  /** Brings the page into the graph view with a laid out graph. */
  async function openGraph(): Promise<void> {
    state.source.set(yaml);
    await settleUntil(() => showButton()?.disabled === false);
    showButton()?.click();
    await settleUntil(() => fixture.nativeElement.querySelector('app-rendering') !== null);
  }

  beforeEach(async () => {
    downloads = [];
    compactQuery = new FakeMediaQuery(false);
    // Other queries (the theme's) get their own fake, so going compact does not switch the theme.
    vi.stubGlobal('matchMedia', (query: string) =>
      query === compactLayoutQuery ? compactQuery : new FakeMediaQuery(false)
    );

    const svgExportStub: Pick<SvgExport, 'download'> = {
      download: (svg, fileName) => {
        downloads.push({ svg, fileName });
      },
    };

    await TestBed.configureTestingModule({
      imports: [GraphPage],
      providers: [provideRouter([]), { provide: SvgExport, useValue: svgExportStub }],
    }).compileComponents();

    state = TestBed.inject(ComposeState);
    fixture = TestBed.createComponent(GraphPage);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts on the home screen', () => {
    expect(fixture.nativeElement.querySelector('app-home')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-rendering')).toBeNull();
  });

  it('switches to the graph view when home submits', async () => {
    await openGraph();

    expect(fixture.nativeElement.querySelector('app-rendering')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-editor')).not.toBeNull();
  });

  it('shows no detail panel before a node is selected', async () => {
    await openGraph();

    expect(panel()).toBeNull();
  });

  it('shows the detail panel for the clicked service', async () => {
    await openGraph();
    clickNode('web');
    await fixture.whenStable();

    expect(panel()?.textContent).toContain('web');
  });

  it('deselects a service that is clicked again', async () => {
    await openGraph();
    clickNode('web');
    await fixture.whenStable();
    clickNode('web');
    await fixture.whenStable();

    expect(panel()).toBeNull();
  });

  it('closes the panel when the graph clears the selection', async () => {
    await openGraph();
    clickNode('web');
    await fixture.whenStable();

    fixture.nativeElement
      .querySelector('app-rendering')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(panel()).toBeNull();
  });

  it('keeps the panel closed when a non-service node is clicked', async () => {
    await openGraph();
    clickNode('net:web');
    await fixture.whenStable();

    expect(panel()).toBeNull();
  });

  it('switches the panel to another service', async () => {
    await openGraph();
    clickNode('web');
    await fixture.whenStable();
    clickNode('api');
    await fixture.whenStable();

    expect(panel()?.textContent).not.toContain('nginx');
    expect(panel()?.textContent).toContain('node:22-alpine');
  });

  describe('detail column', () => {
    function overview(): HTMLElement | null {
      return fixture.nativeElement.querySelector('app-stack-overview');
    }

    function buttonIn(container: HTMLElement | null, name: string): HTMLButtonElement {
      const button = Array.from(container?.querySelectorAll('button') ?? []).find((b) =>
        b.textContent?.trim().startsWith(name)
      );
      if (!button) {
        throw new Error(`No button "${name}"`);
      }
      return button;
    }

    function heading(container: HTMLElement | null): HTMLElement | null {
      return container?.querySelector('h2') ?? null;
    }

    it('shows the stack overview until a service is selected', async () => {
      await openGraph();

      expect(overview()).not.toBeNull();

      clickNode('web');
      await fixture.whenStable();

      expect(overview()).toBeNull();
      expect(panel()).not.toBeNull();
    });

    it('selects a service from the overview and moves focus to its details', async () => {
      await openGraph();
      buttonIn(overview(), 'api').click();
      await fixture.whenStable();

      expect(heading(panel())?.textContent?.trim()).toBe('api');
      expect(document.activeElement).toBe(heading(panel()));
      expect(
        fixture.nativeElement.querySelector('[data-node-id="api"]')?.getAttribute('aria-pressed')
      ).toBe('true');
    });

    it('switches to a dependency from the panel, keeping focus in the panel', async () => {
      await openGraph();
      clickNode('web');
      await fixture.whenStable();

      buttonIn(panel(), 'api').click();
      await fixture.whenStable();

      expect(heading(panel())?.textContent?.trim()).toBe('api');
      expect(document.activeElement).toBe(heading(panel()));
    });

    it('selects rather than toggles when the panel names the selected service', async () => {
      await openGraph();
      buttonIn(overview(), 'web').click();
      await fixture.whenStable();
      buttonIn(panel(), 'api').click();
      await fixture.whenStable();
      buttonIn(panel(), 'web').click();
      await fixture.whenStable();

      expect(heading(panel())?.textContent?.trim()).toBe('web');
    });

    it('closes the details and lands focus on the overview heading', async () => {
      await openGraph();
      clickNode('web');
      await fixture.whenStable();

      panel()?.querySelector<HTMLButtonElement>('button[aria-label="Close details"]')?.click();
      await fixture.whenStable();

      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(heading(overview()));
    });

    it('does not move focus when a service is selected in the graph', async () => {
      await openGraph();
      clickNode('web');
      await fixture.whenStable();

      expect(document.activeElement).not.toBe(heading(panel()));
    });
  });

  it('returns to home when the source is emptied', async () => {
    await openGraph();
    state.source.set('');
    await settleUntil(() => fixture.nativeElement.querySelector('app-home') !== null);

    expect(fixture.nativeElement.querySelector('app-home')).not.toBeNull();
  });

  describe('split view layout', () => {
    it('names the file and summarises the stack in the header', async () => {
      await openGraph();
      const header: HTMLElement = fixture.nativeElement.querySelector('app-site-header');

      expect(header.querySelector('h1')?.textContent).toBe('docker-compose.yml');
      expect(header.querySelector('.summary')?.textContent).toBe(
        '2 services, 1 network, 0 volumes'
      );
    });

    it('shows neither file name nor summary on the home screen', () => {
      const header: HTMLElement = fixture.nativeElement.querySelector('app-site-header');

      expect(header.querySelector('h1')).toBeNull();
      expect(header.querySelector('.summary')).toBeNull();
    });

    it('offers a skip link to the graph, which can take focus', async () => {
      await openGraph();
      const skip: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.skip-link');
      const graph: HTMLElement | null = fixture.nativeElement.querySelector('#graph');

      expect(skip?.getAttribute('href')).toBe('#graph');
      expect(graph?.getAttribute('tabindex')).toBe('-1');
    });

    it('summarises the parse result in the status bar', async () => {
      await openGraph();
      const summary: HTMLElement | null = fixture.nativeElement.querySelector(
        '.editor-status app-parse-summary'
      );

      expect(summary?.textContent).toContain('Valid YAML');
      expect(summary?.querySelector('[role="status"]')).not.toBeNull();

      state.source.set('services:\n  web: [');
      await settleUntil(() => state.state().status === 'error');

      expect(summary?.textContent).toContain('The graph shows the last valid version');
    });

    it('explains a syntax error and jumps to it in the editor', async () => {
      await openGraph();
      expect(fixture.nativeElement.querySelector('app-error-box')).toBeNull();

      state.source.set('services:\n  web:\n    image: a\n    image: b\n');
      await settleUntil(() => state.settled().status === 'error');

      const box: HTMLElement | null = fixture.nativeElement.querySelector(
        '.editor-column app-error-box'
      );
      expect(box?.querySelector('h3')?.textContent).toContain('line 4, column 5');

      box?.querySelector<HTMLButtonElement>('button.go-to')?.click();
      await fixture.whenStable();

      const textarea: HTMLTextAreaElement =
        fixture.nativeElement.querySelector('app-editor textarea');
      expect(document.activeElement).toBe(textarea);
      expect(
        fixture.nativeElement.querySelector('[data-testid="caret-position"]')?.textContent?.trim()
      ).toBe('Ln 4, Col 5');
    });

    it('keeps the error box while the next change is pending', async () => {
      await openGraph();
      state.source.set('services:\n  web: [\n');
      await settleUntil(() => state.settled().status === 'error');

      state.source.set('services:\n  web: [x\n');
      await fixture.whenStable();

      expect(state.state().status).toBe('pending');
      expect(fixture.nativeElement.querySelector('app-error-box')).not.toBeNull();
    });

    it('shows the caret position of the editor below it', async () => {
      await openGraph();
      const caret = (): string =>
        fixture.nativeElement
          .querySelector('[data-testid="caret-position"]')
          ?.textContent?.replace(/\s+/g, ' ')
          .trim();

      expect(caret()).toBe('Ln 1, Col 1');

      const textarea: HTMLTextAreaElement =
        fixture.nativeElement.querySelector('app-editor textarea');
      const offset = textarea.value.indexOf('web:');
      textarea.setSelectionRange(offset, offset);
      textarea.dispatchEvent(new Event('keyup'));
      await fixture.whenStable();

      expect(caret()).toBe('Ln 3, Col 3');
      expect(fixture.nativeElement.querySelector('.editor-status [aria-live]')).toBeNull();
    });

    it('shows legend and zoom controls in a toolbar below the canvas', async () => {
      await openGraph();
      const toolbar: HTMLElement | null =
        fixture.nativeElement.querySelector('#graph .graph-toolbar');

      expect(toolbar?.querySelector('app-legend')).not.toBeNull();
      expect(toolbar?.querySelector('app-zoom-controls')).not.toBeNull();
      expect(toolbar?.previousElementSibling?.tagName.toLowerCase()).toBe('app-rendering');
    });

    it('zooms the canvas from the toolbar', async () => {
      await openGraph();
      const group = () =>
        fixture.nativeElement.querySelector('app-rendering svg > g')?.getAttribute('transform');

      fixture.nativeElement.querySelector('app-zoom-controls [aria-label="Zoom in"]').click();
      await fixture.whenStable();
      expect(group()).not.toBe('translate(0,0) scale(1)');

      fixture.nativeElement.querySelector('app-zoom-controls .fit').click();
      await fixture.whenStable();
      expect(group()).toBe('translate(0,0) scale(1)');
    });
  });

  // jsdom computes no layout, so these check semantics and state; which pane
  // is displayed is up to the stylesheet and is checked in a real browser.
  describe('compact layout', () => {
    function main(): HTMLElement {
      return fixture.nativeElement.querySelector('main');
    }

    function tab(name: string): HTMLButtonElement | null {
      return fixture.nativeElement.querySelector(`[role="tab"][aria-controls="${name}"]`);
    }

    function pane(id: string): HTMLElement | null {
      return fixture.nativeElement.querySelector(`#${id}`);
    }

    async function goCompact(): Promise<void> {
      compactQuery.emit(true);
      await fixture.whenStable();
    }

    it('shows plain columns without tabs on wide screens', async () => {
      await openGraph();

      expect(fixture.nativeElement.querySelector('[role="tablist"]')).toBeNull();
      expect(pane('editor')?.hasAttribute('role')).toBe(false);
      expect(pane('graph')?.hasAttribute('role')).toBe(false);
      expect(pane('graph')?.getAttribute('aria-labelledby')).toBe('graph-title');
    });

    it('turns the columns into tab panels on small screens, graph first', async () => {
      await openGraph();
      await goCompact();

      expect(main().dataset['pane']).toBe('graph');
      expect(tab('graph')?.getAttribute('aria-selected')).toBe('true');
      expect(tab('graph')?.tabIndex).toBe(0);
      expect(tab('editor')?.getAttribute('aria-selected')).toBe('false');
      expect(tab('editor')?.tabIndex).toBe(-1);

      for (const id of ['editor', 'graph']) {
        expect(pane(id)?.getAttribute('role')).toBe('tabpanel');
        expect(pane(id)?.getAttribute('aria-labelledby')).toBe(tab(id)?.id);
      }
    });

    it('switches panes with the tabs', async () => {
      await openGraph();
      await goCompact();

      tab('editor')?.click();
      await fixture.whenStable();

      expect(main().dataset['pane']).toBe('editor');
      expect(tab('editor')?.getAttribute('aria-selected')).toBe('true');
      expect(tab('graph')?.getAttribute('aria-selected')).toBe('false');
    });

    it('shows the graph before the skip link moves focus to it', async () => {
      await openGraph();
      await goCompact();
      tab('editor')?.click();
      await fixture.whenStable();

      const skip: HTMLAnchorElement = fixture.nativeElement.querySelector('.skip-link');
      skip.click();
      await fixture.whenStable();

      expect(main().dataset['pane']).toBe('graph');
      expect(document.activeElement).toBe(pane('graph'));
    });

    it('keeps the chosen pane when the screen becomes wide and small again', async () => {
      await openGraph();
      await goCompact();
      tab('editor')?.click();
      await fixture.whenStable();

      compactQuery.emit(false);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('[role="tablist"]')).toBeNull();

      await goCompact();
      expect(tab('editor')?.getAttribute('aria-selected')).toBe('true');
    });

    it('keeps the file name as the page heading and repeats the summary above the graph', async () => {
      await openGraph();
      await goCompact();
      const header: HTMLElement = fixture.nativeElement.querySelector('app-site-header');

      // Only visually hidden in the compact header: the page keeps its h1.
      expect(header.querySelector('h1')?.textContent).toBe('docker-compose.yml');
      expect(pane('graph')?.querySelector('.pane-summary')?.textContent?.trim()).toBe(
        '2 services, 1 network, 0 volumes'
      );
    });

    // The sheet's own behaviour is covered in detail-sheet.spec.ts; these
    // check how the page wires it up.
    describe('details sheet', () => {
      function handle(): HTMLButtonElement | null {
        return fixture.nativeElement.querySelector('app-detail-sheet .handle');
      }

      function handleName(): string {
        return handle()?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      }

      it('has no handle on wide screens, where the details are a column', async () => {
        await openGraph();

        expect(handle()).toBeNull();
      });

      it('starts collapsed, holding the stack overview', async () => {
        await openGraph();
        await goCompact();

        expect(handle()?.getAttribute('aria-expanded')).toBe('false');
        expect(handleName()).toBe('Stack overview');
      });

      it('opens when a service is picked in the graph, leaving focus there', async () => {
        await openGraph();
        await goCompact();
        const focusBefore = document.activeElement;

        clickNode('web');
        await fixture.whenStable();

        expect(handle()?.getAttribute('aria-expanded')).toBe('true');
        expect(handleName()).toBe('Service web');
        expect(document.activeElement).toBe(focusBefore);
      });

      it('opens again on the next pick after the handle closed it', async () => {
        await openGraph();
        await goCompact();
        clickNode('web');
        await fixture.whenStable();

        handle()?.click();
        await fixture.whenStable();
        expect(handle()?.getAttribute('aria-expanded')).toBe('false');

        clickNode('api');
        await fixture.whenStable();
        expect(handle()?.getAttribute('aria-expanded')).toBe('true');
      });

      it('stays collapsed when a network is clicked, which has no details', async () => {
        await openGraph();
        await goCompact();

        clickNode('net:web');
        await fixture.whenStable();

        expect(handle()?.getAttribute('aria-expanded')).toBe('false');
      });
    });

    it('moves the legend into the sheet and leaves the zoom on the graph', async () => {
      await openGraph();
      const toolbar = (): HTMLElement => fixture.nativeElement.querySelector('.graph-toolbar');
      expect(toolbar().querySelector('app-legend')).not.toBeNull();

      await goCompact();

      expect(toolbar().querySelector('app-legend')).toBeNull();
      expect(toolbar().querySelector('app-zoom-controls')).not.toBeNull();
      const legends = fixture.nativeElement.querySelectorAll('app-legend');
      expect(legends).toHaveLength(1);
      expect(legends[0].closest('app-detail-sheet')).not.toBeNull();
    });

    describe('while the YAML has an error', () => {
      async function breakTheYaml(): Promise<void> {
        state.source.set('services:\n  web: [');
        await settleUntil(() => state.settled().status === 'error');
      }

      function notice(): HTMLElement | null {
        return pane('graph')?.querySelector('.stale-note') ?? null;
      }

      it('marks the Editor tab and says above the graph that it is stale', async () => {
        await openGraph();
        await goCompact();
        expect(notice()).toBeNull();

        await breakTheYaml();

        expect(tab('editor')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Editor has errors');
        expect(notice()?.textContent).toContain('The graph shows the last valid version.');
        // A live region, in case the error settles while the graph tab is open
        expect(notice()?.closest('[role="status"]')).not.toBeNull();
      });

      it('takes the user to the Editor tab, with focus on the tab', async () => {
        await openGraph();
        await goCompact();
        await breakTheYaml();

        notice()?.querySelector('button')?.click();
        await fixture.whenStable();

        expect(main().dataset['pane']).toBe('editor');
        expect(document.activeElement).toBe(tab('editor'));
      });

      it('clears both when the YAML is valid again', async () => {
        await openGraph();
        await goCompact();
        await breakTheYaml();

        state.source.set(yaml);
        await settleUntil(() => state.settled().status === 'ready');

        expect(tab('editor')?.textContent?.trim()).toBe('Editor');
        expect(notice()).toBeNull();
      });
    });

    it('keeps only the legal links in the footer of the compact split view', async () => {
      const footerLinks = (): (string | undefined)[] =>
        Array.from<Element>(fixture.nativeElement.querySelectorAll('app-site-footer nav a')).map(
          (a) => a.textContent?.trim()
        );
      await goCompact();
      // The home view keeps the full footer at any width.
      expect(footerLinks()).toContain('About');

      await openGraph();

      expect(footerLinks()).toEqual(['Impressum', 'Datenschutz']);
    });
  });

  it('returns to home when the brand is clicked', async () => {
    await openGraph();
    fixture.nativeElement.querySelector('app-site-header a.brand').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-home')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-rendering')).toBeNull();
  });

  it('reopens the graph view after the page was recreated', async () => {
    await openGraph();
    fixture.destroy();

    // A detour to another route destroys the page; coming back creates a new one.
    fixture = TestBed.createComponent(GraphPage);
    await settleUntil(() => fixture.nativeElement.querySelector('app-rendering') !== null);

    expect(fixture.nativeElement.querySelector('app-home')).toBeNull();
  });

  it('credits the author on the home screen only', async () => {
    const tagline = () => fixture.nativeElement.querySelector('app-site-footer .tagline');
    expect(tagline()?.textContent).toContain('Tobias Klanert');

    await openGraph();

    expect(tagline()?.textContent).toBe('Runs in your browser. Nothing is uploaded.');
  });

  it('renders the sample graph when "Try it" is clicked', async () => {
    tryItButton()?.click();
    await settleUntil(() => fixture.nativeElement.querySelector('[data-node-id="api"]') !== null);

    expect(fixture.nativeElement.querySelector('[data-node-id="db"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-node-id="net:internal"]')).not.toBeNull();
  });

  function exportButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('[data-testid="export-svg"]');
  }

  describe('svg export', () => {
    it('offers no export before the graph is open', () => {
      expect(exportButton()).toBeNull();
    });

    it('hands the rendered svg to the export service', async () => {
      await openGraph();
      exportButton()?.click();

      expect(downloads).toHaveLength(1);
      expect(downloads[0]?.svg).toBe(fixture.nativeElement.querySelector('app-rendering svg'));
      expect(downloads[0]?.fileName).toMatch(/\.svg$/);
    });
  });
});
