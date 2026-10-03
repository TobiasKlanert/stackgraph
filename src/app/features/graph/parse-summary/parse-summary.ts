import { Component, computed, input } from '@angular/core';
import { ParseState } from '../../../core/state/compose-state';
import { formatDuration } from '../../../core/format/format-duration';

/**
 * One-line parse result for the status bar of the split view. Expects the
 * settled state (`ComposeState.settled`), so it never flickers while typing.
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

  protected readonly errorLabel = computed(() => {
    const state = this.status();
    const n = state.status === 'error' ? state.errors.length : 0;
    return `${n} ${n === 1 ? 'error' : 'errors'}`;
  });

  protected readonly duration = computed(() => {
    const state = this.status();
    return state.status === 'ready' ? formatDuration(state.parseMs) : '';
  });
}
