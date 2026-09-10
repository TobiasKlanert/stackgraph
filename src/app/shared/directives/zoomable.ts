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
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from 'd3-zoom';

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

  private readonly currentTransform = signal(zoomIdentity);

  /** Ready to bind: "translate(x,y) scale(k)". */
  readonly transform = computed(() => this.currentTransform().toString());

  private readonly behavior: ZoomBehavior<SVGSVGElement, unknown> = zoom<SVGSVGElement, unknown>();

  constructor() {
    afterNextRender(() => {
      const selection = select(this.host.nativeElement);

      this.behavior
        .scaleExtent(this.scaleExtent())
        .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
          this.currentTransform.set(event.transform);
        });

      selection.call(this.behavior);

      this.destroyRef.onDestroy(() => {
        selection.on('.zoom', null);
      });
    });
  }
}
