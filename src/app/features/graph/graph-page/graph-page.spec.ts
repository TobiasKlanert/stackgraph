import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GraphPage } from './graph-page';
import { ComposeState } from '../../../core/state/compose-state';
import { SvgExport } from '../../../core/export/svg-export';

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
