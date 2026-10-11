import { Component, input, model } from '@angular/core';

/**
 * The details area of the split view: a column on wide screens, a sheet
 * under the graph in the compact layout. The content is projected; the
 * sheet adds the handle and hides the content while it is collapsed.
 */
@Component({
  selector: 'app-detail-sheet',
  templateUrl: './detail-sheet.html',
  styleUrl: './detail-sheet.scss',
  host: {
    '[attr.data-sheet]': "expanded() ? 'expanded' : 'collapsed'",
  },
})
export class DetailSheet {
  /** Whether the page shows the compact layout. Only then is this a sheet with a handle. */
  readonly compact = input(false);

  /** What the sheet holds, named on the handle: "Stack overview" or a service name. */
  readonly name = input.required<string>();

  /** Quiet label before the name, e.g. "Service". */
  readonly kind = input<string>();

  /** Open or collapsed. Two-way, so the page can open it when a service is picked. */
  readonly expanded = model(false);

  protected toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }
}
