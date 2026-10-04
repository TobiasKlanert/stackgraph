import { Component, computed, input } from '@angular/core';
import { ServiceGraphNode } from '../../../../../core/models/layout.model';
import {
  layoutPortChips,
  monoCharWidth,
  sansCharWidth,
  serviceContentWidth,
  serviceGeometry,
  truncate,
} from '../../../../../core/layout/node-geometry';

/** Text cut to fit, with the original kept for a <title>. */
interface FittedText {
  shown: string;
  full: string;
  truncated: boolean;
}

function fit(full: string, maxWidth: number, charWidth: number): FittedText {
  const shown = truncate(full, maxWidth, charWidth);
  return { shown, full, truncated: shown !== full };
}

/**
 * Draws a service in its own coordinate system, origin at the top-left
 * corner. Positioning, selection handling and focus belong to Rendering.
 */
@Component({
  // Attribute selector on an SVG element: an element selector would create
  // an unknown <app-service-shape> element that SVG does not render.
  selector: 'g[app-service-shape]',
  templateUrl: './service-shape.html',
  styleUrl: './service-shape.scss',
  host: {
    '[class.selected]': 'selected()',
  },
})
export class ServiceShape {
  readonly node = input.required<ServiceGraphNode>();
  readonly selected = input(false);
  readonly focused = input(false);

  protected readonly g = serviceGeometry;

  protected readonly width = computed(() => this.node().width ?? 0);
  protected readonly height = computed(() => this.node().height ?? 0);

  protected readonly name = computed(() =>
    fit(this.node().display.name, serviceContentWidth, sansCharWidth(this.g.nameFontSize))
  );

  protected readonly image = computed(() =>
    fit(
      this.node().display.image ?? 'local build',
      serviceContentWidth,
      monoCharWidth(this.g.imageFontSize)
    )
  );

  protected readonly hasImage = computed(() => this.node().display.image !== undefined);

  protected readonly chips = computed(() => {
    const charWidth = monoCharWidth(this.g.chipFontSize);
    return layoutPortChips(this.node().display.ports).map((chip) => ({
      ...chip,
      label: fit(chip.text, chip.width - 2 * this.g.chipPaddingX, charWidth),
    }));
  });
}
