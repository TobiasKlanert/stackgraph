import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkspaceView } from '../../core/state/workspace-view';
import { isPlainClick } from '../events/is-plain-click';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  private readonly workspace = inject(WorkspaceView);

  /**
   * The brand always means "back to the start", from every page. The link
   * navigates to "/", but the router ignores that while "/" is active, so
   * the split view is closed here explicitly.
   */
  protected onBrandClick(event: MouseEvent): void {
    // Modified clicks open a new tab; the current view must stay as it is.
    if (!isPlainClick(event)) {
      return;
    }
    this.workspace.close();
  }
}
