import { Component, computed, inject, output } from '@angular/core';
import { ComposeState } from '../../../core/state/compose-state';
import { sampleCompose } from '../../../core/samples/sample-compose';
import { StatusPanel } from '../../../shared/status-panel/status-panel';

@Component({
  selector: 'app-home',
  imports: [StatusPanel],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly state = inject(ComposeState);

  /** Asks the page to switch to the graph view. */
  readonly submitted = output<void>();

  /** Only a successfully parsed and laid out compose file opens the graph. */
  protected readonly canOpen = computed(() => this.state.state().status === 'ready');

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.state.source.set(target.value);
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onTryIt(): void {
    this.state.source.set(sampleCompose);
    this.submitted.emit();
  }
}
