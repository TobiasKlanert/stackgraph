import { Component, input, output, computed, inject, viewChild, ElementRef } from '@angular/core';
import { PositionedGraph, StackGraphEdge, StackGraphNode } from '../../../core/models/layout.model';
import { SvgExport } from '../../../core/export/svg-export';
import { Zoomable } from '../../../shared/directives/zoomable';
import { ServiceShape } from './shapes/service-shape/service-shape';
import { NetworkShape } from './shapes/network-shape/network-shape';
import { VolumeShape } from './shapes/volume-shape/volume-shape';

@Component({
  selector: 'app-rendering',
  imports: [Zoomable, ServiceShape, NetworkShape, VolumeShape],
  templateUrl: './rendering.html',
  styleUrl: './rendering.scss',
})
export class Rendering {
  readonly graph = input.required<PositionedGraph>();

  readonly nodeSelected = output<string>();

  readonly selectedId = input<string | null>(null);

  private readonly svgRoot = viewChild.required<ElementRef<SVGSVGElement>>('svgRoot');
  private readonly svgExport = inject(SvgExport);

  protected onNodeClick(node: StackGraphNode): void {
    if (node.nodeType !== 'service') {
      return;
    }
    this.nodeSelected.emit(node.id);
  }

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

  /** Entry point for GraphPage; Rendering owns the element, the page decides when. */
  exportSvg(fileName: string): void {
    this.svgExport.download(this.svgRoot().nativeElement, fileName);
  }
}
