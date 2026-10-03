import {
  Directive,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { select, type Selection } from 'd3-selection';
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from 'd3-zoom';

export interface Size {
  width: number;
  height: number;
}

/**
 * Screen pixels per content unit at zoom 1. The SVG's viewBox spans the
 * content and the browser scales it to fit the element ("meet"), so zoom 1
 * already means "fitted"; this factor turns it into a real size.
 */
export function fitScale(viewport: Size, content: Size): number | null {
  if (viewport.width <= 0 || viewport.height <= 0 || content.width <= 0 || content.height <= 0) {
    return null;
  }
  return Math.min(viewport.width / content.width, viewport.height / content.height);
}

/** Percentage of the real size: 100 means one content unit is one screen pixel. */
export function displayPercent(fit: number | null, k: number): number | null {
  return fit === null ? null : Math.round(fit * k * 100);
}

/** Tolerance for comparing the zoom factor with the extent's ends. */
const epsilon = 1e-6;

/**
 * Attaches d3-zoom to the host SVG element and exposes the resulting
 * transform as a signal. d3 owns event handling only, writing the
 * transform into the DOM stays with Angular's template binding.
 */
@Directive({
  selector: '[appZoomable]',
  exportAs: 'appZoomable',
})
export class Zoomable {
  private readonly host: ElementRef<SVGSVGElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly scaleExtent = input<[number, number]>([0.25, 4]);

  /** Size of the drawn content, the same numbers as the viewBox. */
  readonly contentSize = input<Size | null>(null);

  private readonly currentTransform = signal(zoomIdentity);
  private readonly viewport = signal<Size>({ width: 0, height: 0 });
  private selection: Selection<SVGSVGElement, unknown, null, undefined> | null = null;

  /** Ready to bind: "translate(x,y) scale(k)". */
  readonly transform = computed(() => this.currentTransform().toString());

  private readonly fit = computed(() => {
    const content = this.contentSize();
    return content === null ? null : fitScale(this.viewport(), content);
  });

  /** Real size in percent, or null until the element has been measured. */
  readonly percent = computed(() => displayPercent(this.fit(), this.currentTransform().k));

  readonly canZoomIn = computed(() => this.currentTransform().k < this.scaleExtent()[1] - epsilon);
  readonly canZoomOut = computed(() => this.currentTransform().k > this.scaleExtent()[0] + epsilon);

  private readonly behavior: ZoomBehavior<SVGSVGElement, unknown> = zoom<SVGSVGElement, unknown>();

  constructor() {
    afterNextRender(() => {
      const element = this.host.nativeElement;
      const selection = select(element);

      this.behavior
        .scaleExtent(this.scaleExtent())
        // The viewBox spans the content, so the content box is the extent.
        // Given explicitly, d3 does not need to read viewBox.baseVal itself.
        .extent((): [[number, number], [number, number]] => {
          const { width, height } = this.contentSize() ?? { width: 0, height: 0 };
          return [
            [0, 0],
            [width, height],
          ];
        })
        .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
          this.currentTransform.set(event.transform);
        });

      selection.call(this.behavior);
      this.selection = selection;

      // jsdom has no ResizeObserver; the percentage then stays unknown.
      const observer =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(([entry]) => {
              if (entry !== undefined) {
                const { width, height } = entry.contentRect;
                this.viewport.set({ width, height });
              }
            });
      observer?.observe(element);

      this.destroyRef.onDestroy(() => {
        selection.on('.zoom', null);
        observer?.disconnect();
        this.selection = null;
      });
    });
  }

  /** Zooms around the centre of the view; d3 clamps to the scale extent. */
  zoomBy(factor: number): void {
    if (this.selection !== null) {
      this.behavior.scaleBy(this.selection, factor);
    }
  }

  /** Back to the whole graph, centred: the identity transform. */
  fitToView(): void {
    if (this.selection !== null) {
      this.behavior.transform(this.selection, zoomIdentity);
    }
  }

  /** One content unit per screen pixel, around the centre of the view. */
  zoomToActualSize(): void {
    const fit = this.fit();
    if (this.selection !== null && fit !== null) {
      this.behavior.scaleTo(this.selection, 1 / fit);
    }
  }
}
