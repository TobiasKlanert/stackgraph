import { Component, computed, input, output } from '@angular/core';

/** Zoom buttons for the graph. Stateless: the page wires them to Rendering. */
@Component({
  selector: 'app-zoom-controls',
  templateUrl: './zoom-controls.html',
  styleUrl: './zoom-controls.scss',
})
export class ZoomControls {
  /** Real size in percent; null while the canvas has not been measured. */
  readonly percent = input<number | null>(null);
  readonly canZoomIn = input(true);
  readonly canZoomOut = input(true);

  readonly zoomIn = output<void>();
  readonly zoomOut = output<void>();
  readonly actualSize = output<void>();
  readonly fit = output<void>();

  protected readonly percentLabel = computed(() => {
    const percent = this.percent();
    return percent === null ? '–' : `${percent}%`;
  });

  /** The visible percentage leads the name, so voice control can say what it sees. */
  protected readonly actualSizeLabel = computed(() => {
    const percent = this.percent();
    return percent === null ? 'Reset zoom to 100%' : `${percent}%, reset zoom to 100%`;
  });
}
