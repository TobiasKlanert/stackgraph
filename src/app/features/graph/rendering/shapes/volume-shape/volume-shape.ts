import { Component, computed, input } from '@angular/core';
import { VolumeGraphNode } from '../../../../../core/models/layout.model';
import {
  sansCharWidth,
  truncate,
  volumeGeometry,
  volumeLabelWidth,
} from '../../../../../core/layout/node-geometry';

/** Cylinder for a named volume, drawn from its own top-left corner. */
@Component({
  selector: 'g[app-volume-shape]',
  templateUrl: './volume-shape.html',
  styleUrl: './volume-shape.scss',
  host: {
    role: 'img',
    '[attr.aria-label]': 'node().display.name + " volume"',
  },
})
export class VolumeShape {
  readonly node = input.required<VolumeGraphNode>();

  protected readonly g = volumeGeometry;

  protected readonly width = computed(() => this.node().width ?? 0);
  protected readonly height = computed(() => this.node().height ?? 0);

  /** Outline: top cap, right side, bottom cap, left side. */
  protected readonly body = computed(() => {
    const w = this.width();
    const h = this.height();
    const rx = w / 2;
    const ry = this.g.capHeight;
    return `M0 ${ry} A${rx} ${ry} 0 0 1 ${w} ${ry} V${h - ry} A${rx} ${ry} 0 0 1 0 ${h - ry} Z`;
  });

  /** Front edge of the lid, which makes the shape read as a cylinder. */
  protected readonly lid = computed(() => {
    const w = this.width();
    const ry = this.g.capHeight;
    return `M0 ${ry} A${w / 2} ${ry} 0 0 0 ${w} ${ry}`;
  });

  protected readonly label = computed(() =>
    truncate(
      this.node().display.name,
      volumeLabelWidth(this.width()),
      sansCharWidth(this.g.labelFontSize)
    )
  );
}
