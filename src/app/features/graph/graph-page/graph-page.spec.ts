import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphPage } from './graph-page';
import { ComposeState } from '../../../core/state/compose-state';

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
    await TestBed.configureTestingModule({ imports: [GraphPage] }).compileComponents();
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

  it('returns to home when the source is emptied', async () => {
    await openGraph();
    state.source.set('');
    await settleUntil(() => fixture.nativeElement.querySelector('app-home') !== null);

    expect(fixture.nativeElement.querySelector('app-home')).not.toBeNull();
  });

  it('renders the sample graph when "Try it" is clicked', async () => {
    tryItButton()?.click();
    await settleUntil(() => fixture.nativeElement.querySelector('[data-node-id="api"]') !== null);

    expect(fixture.nativeElement.querySelector('[data-node-id="db"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-node-id="net:internal"]')).not.toBeNull();
  });
});
