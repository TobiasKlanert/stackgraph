import { Component, computed, input, linkedSignal } from '@angular/core';
import { ParseState } from '../../../core/state/compose-state';
import { formatDuration } from '../../../core/format/format-duration';

/**
 * One-line parse result for the status bar of the split view.
 *
 * The split view only opens with a valid graph and keeps it while the input
 * is broken, so an error here always means "the graph shows the last valid
 * version".
 */
@Component({
  selector: 'app-parse-summary',
  templateUrl: './parse-summary.html',
  styleUrl: './parse-summary.scss',
})
export class ParseSummary {
  readonly status = input.required<ParseState>();

  /**
   * Last settled result. While typing, every pause flips the state to
   * "pending" for the debounce time; showing that would flicker and make the
   * live region talk after each keystroke. A delayed "Updating…" is its own
   * step (roadmap #5).
   */
  protected readonly settled = linkedSignal<ParseState, ParseState>({
    source: this.status,
    computation: (status, previous) =>
      status.status === 'pending' && previous ? previous.value : status,
  });

  protected readonly errorLabel = computed(() => {
    const state = this.settled();
    const n = state.status === 'error' ? state.errors.length : 0;
    return `${n} ${n === 1 ? 'error' : 'errors'}`;
  });

  protected readonly duration = computed(() => {
    const state = this.settled();
    return state.status === 'ready' ? formatDuration(state.parseMs) : '';
  });
}
