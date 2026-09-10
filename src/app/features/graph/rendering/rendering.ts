import { Component, input, computed } from '@angular/core';
import { PositionedGraph, StackGraphEdge } from '../../../core/models/layout.model';
import { Zoomable } from '../../../shared/directives/zoomable';

@Component({
  selector: 'app-rendering',
  imports: [Zoomable],
  templateUrl: './rendering.html',
  styleUrl: './rendering.scss',
})
export class Rendering {
  readonly graph = input.required<PositionedGraph>();

  protected readonly viewBox = computed(() => {
    const g = this.graph();
    return `0 0 ${g.width ?? 0} ${g.height ?? 0}`;
  });

  edgePath(edge: StackGraphEdge): string {
    if (!edge.sections?.[0]) {
      return '';
    }

    const section = edge.sections[0];
    const list = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint];

    return list
      .map((point, index) => {
        const prefix = index === 0 ? 'M' : 'L';
        return `${prefix} ${point.x} ${point.y}`;
      })
      .join(' ');
  }
}
