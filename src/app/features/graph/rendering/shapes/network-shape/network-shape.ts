import { Component, computed, input } from '@angular/core';
import { NetworkGraphNode } from '../../../../../core/models/layout.model';
import {
  networkGeometry,
  networkLabelWidth,
  sansCharWidth,
  truncate,
} from '../../../../../core/layout/node-geometry';

/** Hexagon for a network, drawn from its own top-left corner. */
@Component({
  selector: 'g[app-network-shape]',
  templateUrl: './network-shape.html',
  styleUrl: './network-shape.scss',
  host: {
    role: 'img',
    '[attr.aria-label]': 'node().display.name + " network"',
  },
})
export class NetworkShape {
  readonly node = input.required<NetworkGraphNode>();

  protected readonly g = networkGeometry;

  protected readonly width = computed(() => this.node().width ?? 0);
  protected readonly height = computed(() => this.node().height ?? 0);

  protected readonly points = computed(() => {
    const w = this.width();
    const h = this.height();
    const s = this.g.slant;
    return `0,${h / 2} ${s},0 ${w - s},0 ${w},${h / 2} ${w - s},${h} ${s},${h}`;
  });

  protected readonly label = computed(() =>
    truncate(
      this.node().display.name,
      networkLabelWidth(this.width()),
      sansCharWidth(this.g.labelFontSize)
    )
  );
}
