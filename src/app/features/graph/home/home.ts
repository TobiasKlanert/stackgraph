import { Component, computed, inject, output } from '@angular/core';
import { ComposeState } from '../../../core/state/compose-state';
import { sampleCompose } from '../../../core/samples/sample-compose';
import { StatusPanel } from '../../../shared/status-panel/status-panel';
import { Editor } from '../editor/editor';

/** Short parse result in the editor header; `kind` only picks the colour. */
interface FieldStatus {
  text: string;
  kind: 'neutral' | 'valid' | 'error';
}

@Component({
  selector: 'app-home',
  imports: [Editor, StatusPanel],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly state = inject(ComposeState);

  /** Asks the page to switch to the graph view. */
  readonly submitted = output<void>();

  /** Only a successfully parsed and laid out compose file opens the graph. */
  protected readonly canOpen = computed(() => this.state.state().status === 'ready');

  /**
   * Same sources as the status bar of the split view (settled + updating),
   * so the header does not flicker while typing. Shorter wording, because
   * there is no graph yet that could show "the last valid version".
   */
  protected readonly fieldStatus = computed<FieldStatus>(() => {
    if (this.state.updating()) {
      return { text: 'Updating…', kind: 'neutral' };
    }
    const settled = this.state.settled();
    switch (settled.status) {
      case 'empty':
        return { text: 'Empty', kind: 'neutral' };
      case 'ready':
        return { text: 'Valid', kind: 'valid' };
      case 'error': {
        const n = settled.errors.length;
        return { text: `${n} ${n === 1 ? 'error' : 'errors'}`, kind: 'error' };
      }
    }
  });

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onTryIt(): void {
    this.state.source.set(sampleCompose);
    this.submitted.emit();
  }
}
