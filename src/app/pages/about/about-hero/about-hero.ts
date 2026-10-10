import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { externalLinks } from '../../../core/config/external-links';
import { sampleCompose } from '../../../core/samples/sample-compose';
import { ComposeState } from '../../../core/state/compose-state';
import { WorkspaceView } from '../../../core/state/workspace-view';
import { isPlainClick } from '../../../shared/events/is-plain-click';

/**
 * Top of the About page: the 30-second version and the way into the app.
 * The only part of the page with behaviour, hence its own component.
 */
@Component({
  selector: 'app-about-hero',
  imports: [RouterLink],
  templateUrl: './about-hero.html',
  styleUrl: './about-hero.scss',
})
export class AboutHero {
  private readonly state = inject(ComposeState);
  private readonly workspace = inject(WorkspaceView);

  protected readonly links = externalLinks;

  /**
   * The editor already holds the visitor's own file. The main button then
   * leads back to it instead of loading the example over it: there is no
   * undo yet (v1.1), and the text would be lost without a warning.
   */
  protected readonly hasOwnSource = computed(() => this.state.source().trim() !== '');

  /** Loads the example and opens the graph; the link itself navigates to "/". */
  protected onTryIt(event: MouseEvent): void {
    // Modified clicks open a new tab; this tab must stay as it is.
    if (!isPlainClick(event) || this.hasOwnSource()) {
      return;
    }
    this.state.source.set(sampleCompose);
    this.workspace.open();
  }
}
