import { Component, ElementRef, computed, input, output, viewChild } from '@angular/core';
import { ComposeModel, ServiceNode } from '../../../core/models/compose.model';
import { describePort } from '../../../core/format/format-port';
import { requiredBy } from '../../../core/relations/relations';
import { TypeIcon } from '../type-icon/type-icon';

@Component({
  selector: 'app-detail-panel',
  imports: [TypeIcon],
  templateUrl: './detail-panel.html',
  styleUrl: './detail-panel.scss',
  host: {
    '(keydown.escape)': 'closed.emit()',
  },
})
export class DetailPanel {
  readonly service = input.required<ServiceNode>();
  /** The whole stack, for the reverse relations and for checking references. */
  readonly model = input.required<ComposeModel>();

  /** A related service was chosen; the page selects it. */
  readonly serviceSelected = output<string>();
  readonly closed = output<void>();

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly requiredBy = computed(() => requiredBy(this.model(), this.service().name));

  private readonly serviceNames = computed(() => new Set(this.model().services.map((s) => s.name)));

  protected readonly describePort = describePort;

  /** depends_on may name a service the file does not define; that one is not selectable. */
  protected isDefined(name: string): boolean {
    return this.serviceNames().has(name);
  }

  /** The page calls this after a change it caused from the panel, so focus is never lost. */
  focusHeading(): void {
    this.heading().nativeElement.focus();
  }
}
