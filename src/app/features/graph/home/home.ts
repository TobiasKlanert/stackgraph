import {
  Component,
  computed,
  inject,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { ComposeState, ParseState } from '../../../core/state/compose-state';
import { sampleCompose } from '../../../core/samples/sample-compose';
import { ErrorBox } from '../../../shared/error-box/error-box';
import { Editor } from '../editor/editor';

/** Short parse result in the editor header; `kind` only picks the colour. */
interface FieldStatus {
  text: string;
  kind: 'neutral' | 'valid' | 'error';
}

const emptyHint = 'Paste a compose file first, or try the example.';

@Component({
  selector: 'app-home',
  imports: [Editor, ErrorBox],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly state = inject(ComposeState);
  protected readonly emptyHint = emptyHint;

  /** Asks the page to switch to the graph view. */
  readonly submitted = output<void>();

  private readonly editorField = viewChild.required(Editor);

  /** Results without the pending phases, for a click while parsing is still running. */
  private readonly results$ = toObservable(this.state.state).pipe(
    filter((state) => state.status !== 'pending')
  );

  /** A click is waiting for the current input to be parsed. */
  private waiting = false;

  /**
   * Set by a click that could not open the graph. From then on the reason
   * follows the input: fixing the error removes it, a new error shows up.
   * Validation on submit, then live, like a form.
   */
  private readonly attempted = signal(false);

  /** Why the graph did not open, or null. Settled state, so it does not flicker. */
  protected readonly feedback = computed(() => {
    const settled = this.state.settled();
    return this.attempted() && settled.status !== 'ready' ? settled : null;
  });

  /**
   * Sentence for screen readers, set by the click only: focus moves into the
   * field, and this says why. Cleared on the next edit so stale text does not
   * linger, and not derived from the input so typing is not announced.
   */
  protected readonly announcement = linkedSignal({
    source: this.state.source,
    computation: () => '',
  });

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

  /**
   * The button is never disabled (A11y review #9): a disabled button gives
   * no reason. A click opens the graph or says what is missing.
   */
  protected async onSubmit(): Promise<void> {
    if (this.waiting) {
      return;
    }
    this.waiting = true;
    try {
      // Pasted and clicked right away: wait for the result instead of
      // asking for a second click.
      const result = await firstValueFrom(this.results$);
      if (result.status === 'ready') {
        this.submitted.emit();
        return;
      }
      this.attempted.set(true);
      this.announcement.set(reason(result));
      this.editorField().focus();
    } finally {
      this.waiting = false;
    }
  }

  protected onTryIt(): void {
    this.state.source.set(sampleCompose);
    this.submitted.emit();
  }
}

/** One sentence on what stops the graph from opening. */
function reason(state: Exclude<ParseState, { status: 'ready' | 'pending' }>): string {
  if (state.status === 'empty') {
    return emptyHint;
  }
  const line = state.errors[0]?.line;
  if (state.errors.length === 1) {
    return line === undefined ? 'Fix the error first.' : `Fix the error on line ${line} first.`;
  }
  return `Fix the ${state.errors.length} errors first.`;
}
