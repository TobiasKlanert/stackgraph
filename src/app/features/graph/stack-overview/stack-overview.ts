import { Component, ElementRef, computed, input, output, viewChild } from '@angular/core';
import { ComposeModel } from '../../../core/models/compose.model';
import { servicesOnNetwork, servicesUsingVolume } from '../../../core/relations/relations';
import { TypeIcon } from '../type-icon/type-icon';

/**
 * The detail column while nothing is selected: the whole stack as text.
 * Doubles as the text alternative to the graph (WCAG 1.1.1) — every service
 * can be selected from here without touching the canvas.
 */
@Component({
  selector: 'app-stack-overview',
  imports: [TypeIcon],
  templateUrl: './stack-overview.html',
  styleUrl: './stack-overview.scss',
})
export class StackOverview {
  readonly model = input.required<ComposeModel>();

  readonly serviceSelected = output<string>();

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly services = computed(() =>
    this.model().services.map((s) => ({
      name: s.name,
      image: s.image,
      // Only fixed host ports: they are what you open in the browser.
      hostPorts: s.ports.flatMap((p) => (p.host ? [p.host] : [])).join(', '),
    }))
  );

  protected readonly networks = computed(() =>
    this.model().networks.map((n) => ({
      name: n.name,
      services: servicesOnNetwork(this.model(), n.name),
    }))
  );

  protected readonly volumes = computed(() =>
    this.model().volumes.map((v) => ({
      name: v.name,
      services: servicesUsingVolume(this.model(), v.name),
    }))
  );

  focusHeading(): void {
    this.heading().nativeElement.focus();
  }
}
