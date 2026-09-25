import { Component, inject, signal, computed } from '@angular/core';
import { ComposeState, type ReadyState } from '../../../core/state/compose-state';
import { Editor } from '../editor/editor';
import { Rendering } from '../rendering/rendering';
import { DetailPanel } from '../detail-panel/detail-panel';
import { Home } from '../home/home';
import { StatusPanel } from '../../../shared/status-panel/status-panel';

@Component({
  selector: 'app-graph-page',
  imports: [Editor, Rendering, DetailPanel, Home, StatusPanel],
  templateUrl: './graph-page.html',
  styleUrl: './graph-page.scss',
})
export class GraphPage {
  protected readonly state = inject(ComposeState);
  protected readonly showGraph = signal(false);
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

  protected onNodeSelected(id: string): void {
    this.selectedId.set(id);
  }

  protected openGraph(): void {
    this.showGraph.set(true);
  }

  /** The graph view is only shown once the user opened it and a good layout exists. */
  protected readonly graphView = computed<ReadyState | null>(() =>
    this.showGraph() ? this.state.displayed() : null
  );
}
