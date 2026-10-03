import { Component, inject, signal, computed, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ComposeState, type ReadyState } from '../../../core/state/compose-state';
import { WorkspaceView } from '../../../core/state/workspace-view';
import { Editor } from '../editor/editor';
import { Rendering } from '../rendering/rendering';
import { DetailPanel } from '../detail-panel/detail-panel';
import { Home } from '../home/home';
import { Legend } from '../legend/legend';
import { ZoomControls } from '../zoom-controls/zoom-controls';
import { StatusPanel } from '../../../shared/status-panel/status-panel';
import { SiteHeader } from '../../../shared/site-header/site-header';
import { SiteFooter, privacyNote } from '../../../shared/site-footer/site-footer';
import { ThemeToggle } from '../../../shared/theme-toggle/theme-toggle';

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

@Component({
  selector: 'app-graph-page',
  imports: [
    RouterLink,
    Editor,
    Rendering,
    DetailPanel,
    Home,
    StatusPanel,
    SiteHeader,
    SiteFooter,
    ThemeToggle,
    Legend,
    ZoomControls,
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
  protected readonly selectedId = signal<string | null>(null);

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

  protected openGraph(): void {
    this.workspace.open();
  }

  /** The graph view is only shown once the user opened it and a good layout exists. */
  protected readonly graphView = computed<ReadyState | null>(() =>
    this.workspace.isOpen() ? this.state.displayed() : null
  );

  private readonly rendering = viewChild(Rendering);

  protected onExport(): void {
    this.rendering()?.exportSvg('stackgraph.svg');
  }
}
