import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
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

function isFocusVisible(target: EventTarget | null): boolean {
  try {
    return target instanceof Element && target.matches(':focus-visible');
  } catch {
    // Environments without :focus-visible support: show the ring rather than nothing.
    return true;
  }
}

/** Factor per click: four clicks double the size, zooming out retraces them exactly. */
const zoomStep = 2 ** 0.25;
const edgeOrder: Record<EdgeType, number> = { network: 0, volume: 1, dependsOn: 2 };

@Component({
  selector: 'app-rendering',
  imports: [Zoomable, ServiceShape, NetworkShape, VolumeShape],
  templateUrl: './rendering.html',
  styleUrl: './rendering.scss',
  host: {
    '(click)': 'onBackgroundClick($event)',
    '(keydown.escape)': 'selectionCleared.emit()',
  },
})
export class Rendering {
  readonly graph = input.required<PositionedGraph>();

  readonly nodeSelected = output<string>();

  /** Background click or Escape: nothing should be selected any more. */
  readonly selectionCleared = output<void>();

  readonly selectedId = input<string | null>(null);

  private readonly svgRoot = viewChild.required<ElementRef<SVGSVGElement>>('svgRoot');
  private readonly zoomable = viewChild.required(Zoomable);
  private readonly svgExport = inject(SvgExport);

  /**
   * Service that shows the keyboard focus ring. Drawn as an SVG shape,
   * because outline on SVG groups is not rendered reliably everywhere.
   */
  protected readonly focusedId = signal<string | null>(null);

  protected ariaLabel(node: StackGraphNode): string | null {
    if (node.nodeType !== 'service') {
      return null;
    }
    return `${node.display.name}, ${node.display.image ?? 'local build'}`;
  }

  protected onNodeFocus(event: FocusEvent, node: StackGraphNode): void {
    // A ring only for keyboard focus; a mouse click already shows the selection.
    this.focusedId.set(isFocusVisible(event.target) ? node.id : null);
  }

  protected onBackgroundClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    // Clicks on nodes bubble up here too. d3-zoom swallows the click that
    // ends a pan, so dragging the canvas does not clear the selection.
    if (target?.closest('[data-node-id]') === null) {
      this.selectionCleared.emit();
    }
  }

  protected onNodeClick(node: StackGraphNode): void {
    if (node.nodeType !== 'service') {
      return;
    }
    this.nodeSelected.emit(node.id);
  }

  /** Same numbers as the viewBox; the zoom needs them to compute the real size. */
  protected readonly contentSize = computed(() => ({
    width: this.graph().width ?? 0,
    height: this.graph().height ?? 0,
  }));

  protected readonly viewBox = computed(() => {
    const { width, height } = this.contentSize();
    return `0 0 ${width} ${height}`;
  });

  // Zoom API for the page's controls; Rendering stays the only owner of the canvas.
  readonly zoomPercent = computed(() => this.zoomable().percent());
  readonly canZoomIn = computed(() => this.zoomable().canZoomIn());
  readonly canZoomOut = computed(() => this.zoomable().canZoomOut());

  zoomIn(): void {
    this.zoomable().zoomBy(zoomStep);
  }

  zoomOut(): void {
    this.zoomable().zoomBy(1 / zoomStep);
  }

  zoomToActualSize(): void {
    this.zoomable().zoomToActualSize();
  }

  fitToView(): void {
    this.zoomable().fitToView();
  }

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
