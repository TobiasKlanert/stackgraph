import { Component, input } from '@angular/core';

/** Where the legend sits; it decides the title and the spacing. */
export type LegendPlacement = 'toolbar' | 'panel';

@Component({
  selector: 'app-legend',
  imports: [],
  templateUrl: './legend.html',
  styleUrl: './legend.scss',
  host: {
    '[attr.data-placement]': 'placement()',
  },
})
export class Legend {
  /**
   * Toolbar: a row of samples that speak for themselves, the title only for
   * screen readers. Panel: one more labelled group among the panel's groups,
   * as in the details sheet of the compact layout.
   */
  readonly placement = input<LegendPlacement>('toolbar');
}
