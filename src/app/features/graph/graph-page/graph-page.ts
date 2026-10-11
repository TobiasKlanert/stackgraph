import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ComposeState, type ReadyState } from '../../../core/state/compose-state';
import { WorkspaceView } from '../../../core/state/workspace-view';
import { mediaQuery } from '../../../core/platform/media-query';
import { type Pane, compactLayoutQuery, paneTabs } from '../compact-layout';
import { Editor } from '../editor/editor';
import { Rendering } from '../rendering/rendering';
import { DetailPanel } from '../detail-panel/detail-panel';
import { StackOverview } from '../stack-overview/stack-overview';
import { Home } from '../home/home';
import { Legend } from '../legend/legend';
import { ZoomControls } from '../zoom-controls/zoom-controls';
import { ParseSummary } from '../parse-summary/parse-summary';
import { ErrorBox } from '../../../shared/error-box/error-box';
import { SiteHeader } from '../../../shared/site-header/site-header';
import { SiteFooter, privacyNote } from '../../../shared/site-footer/site-footer';
import { ThemeToggle } from '../../../shared/theme-toggle/theme-toggle';

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/** Index of the tab a key moves to (WAI-ARIA tabs pattern), or null for other keys. */
function tabIndexForKey(key: string, current: number, length: number): number | null {
  switch (key) {
    case 'ArrowLeft':
      return (current - 1 + length) % length;
    case 'ArrowRight':
      return (current + 1) % length;
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return null;
  }
}

@Component({
  selector: 'app-graph-page',
  imports: [
    RouterLink,
    Editor,
    Rendering,
    DetailPanel,
    StackOverview,
    Home,
    ErrorBox,
    SiteHeader,
    SiteFooter,
    ThemeToggle,
    Legend,
    ZoomControls,
    ParseSummary,
  ],
  templateUrl: './graph-page.html',
  styleUrl: './graph-page.scss',
  host: {
    '[class.workspace]': 'graphView() !== null',
  },
})
export class GraphPage {
  protected readonly state = inject(ComposeState);
  private readonly workspace = inject(WorkspaceView);
  private readonly injector = inject(Injector);
  protected readonly selectedId = signal<string | null>(null);

  /**
   * Small screens show one pane at a time. The stylesheet does the layout on
   * its own; this signal only switches the tab semantics, so wide screens get
   * plain columns instead of tab panels without tabs.
   */
  protected readonly compact = mediaQuery(compactLayoutQuery);

  /**
   * The pane shown in the compact layout. The graph first: it is what the
   * user came for. Both panes stay rendered, so switching keeps the editor's
   * undo history and caret and the graph's zoom.
   */
  protected readonly pane = signal<Pane>('graph');
  protected readonly paneTabs = paneTabs;
  private readonly paneTabButtons = viewChildren<ElementRef<HTMLButtonElement>>('paneTab');
  private readonly graphPane = viewChild<ElementRef<HTMLElement>>('graphPane');

  /** Arrow keys, Home and End move between the tabs and select them. */
  protected onPaneTabKeydown(event: KeyboardEvent): void {
    const current = paneTabs.findIndex((tab) => tab.pane === this.pane());
    const target = tabIndexForKey(event.key, current, paneTabs.length);
    if (target === null) {
      return;
    }
    const tab = paneTabs[target];
    if (tab === undefined) {
      return;
    }
    event.preventDefault();
    this.pane.set(tab.pane);
    this.paneTabButtons()[target]?.nativeElement.focus();
  }

  /**
   * Behind the Editor tab the graph is not displayed and cannot take focus,
   * so the fragment link alone would go nowhere. Show the graph, then focus it.
   */
  protected skipToGraph(event: MouseEvent): void {
    if (this.pane() === 'graph') {
      return;
    }
    event.preventDefault();
    this.pane.set('graph');
    afterNextRender(() => this.graphPane()?.nativeElement.focus(), { injector: this.injector });
  }

  protected readonly selectedService = computed(() => {
    const id = this.selectedId();
    const view = this.graphView();
    if (id === null || view === null) {
      return null;
    }
    // Service nodes carry no id prefix, so the id is the service name.
    return view.model.services.find((s) => s.name === id) ?? null;
  });

  /** The start page credits the author; every other view repeats the privacy note. */
  protected readonly footerText = computed(() =>
    this.graphView() === null ? 'A portfolio project by Tobias Klanert' : privacyNote
  );

  /** "5 services, 2 networks, 2 volumes" for the header. */
  protected readonly summary = computed(() => {
    const model = this.graphView()?.model;
    if (model === undefined) {
      return '';
    }
    return [
      count(model.services.length, 'service'),
      count(model.networks.length, 'network'),
      count(model.volumes.length, 'volume'),
    ].join(', ');
  });

  /** Selecting the selected service again deselects it, as aria-pressed promises. */
  protected onNodeSelected(id: string): void {
    this.selectedId.update((current) => (current === id ? null : id));
  }

  /** The panel's buttons name a target, they are no switches: select, never toggle. */
  protected selectFromPanel(name: string): void {
    this.selectedId.set(name);
    this.focusPanelHeading();
  }

  protected closeDetails(): void {
    this.selectedId.set(null);
    this.focusPanelHeading();
  }

  /**
   * The control that had focus disappears with the switch (the overview, the
   * close button, a related-service button). Focus goes to the heading of
   * what replaced it, so keyboard and screen reader users stay in the column.
   * Selections from the graph do not move focus: the user is working there.
   */
  private focusPanelHeading(): void {
    afterNextRender(() => (this.detailPanel() ?? this.stackOverview())?.focusHeading(), {
      injector: this.injector,
    });
  }

  protected openGraph(): void {
    this.workspace.open();
  }

  /** The graph view is only shown once the user opened it and a good layout exists. */
  protected readonly graphView = computed<ReadyState | null>(() =>
    this.workspace.isOpen() ? this.state.displayed() : null
  );

  private readonly rendering = viewChild(Rendering);
  private readonly detailPanel = viewChild(DetailPanel);
  private readonly stackOverview = viewChild(StackOverview);

  protected onExport(): void {
    this.rendering()?.exportSvg('stackgraph.svg');
  }
}
