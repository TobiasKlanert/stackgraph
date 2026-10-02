import { Component, input, output, computed, inject, viewChild, ElementRef } from '@angular/core';
import {
  EdgeType,
  PositionedGraph,
  StackGraphEdge,
  StackGraphNode,
} from '../../../core/models/layout.model';
import { SvgExport } from '../../../core/export/svg-export';
import { Zoomable } from '../../../shared/directives/zoomable';
import { ServiceShape } from './shapes/service-shape/service-shape';
import { NetworkShape } from './shapes/network-shape/network-shape';
import { VolumeShape } from './shapes/volume-shape/volume-shape';
import { roundedPath } from './edge-path';

const edgeOrder: Record<EdgeType, number> = { network: 0, volume: 1, dependsOn: 2 };

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

  /**
   * Network and volume edges first, dependencies last: SVG paints in
   * document order, and the arrows carry the most meaning.
   */
  protected readonly edges = computed(() =>
    [...(this.graph().edges ?? [])].sort((a, b) => edgeOrder[a.edgeType] - edgeOrder[b.edgeType])
  );

  edgePath(edge: StackGraphEdge): string {
    const section = edge.sections?.[0];
    if (section === undefined) {
      return '';
    }
    return roundedPath([section.startPoint, ...(section.bendPoints ?? []), section.endPoint]);
  }

  /** Entry point for GraphPage; Rendering owns the element, the page decides when. */
  exportSvg(fileName: string): void {
    this.svgExport.download(this.svgRoot().nativeElement, fileName);
  }
}
