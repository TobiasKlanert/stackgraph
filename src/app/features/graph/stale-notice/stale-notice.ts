import { Component, input, output } from '@angular/core';

/**
 * Says above the graph that it is stale while the YAML has an error. Only
 * the compact layout shows it: there the error box is behind the Editor tab,
 * on wide screens it sits next to the graph.
 *
 * The host is the live region and always rendered, so the notice is also
 * announced when the error settles after the switch to the graph tab (the
 * parse waits 400 ms for typing to pause).
 */
@Component({
  selector: 'app-stale-notice',
  templateUrl: './stale-notice.html',
  styleUrl: './stale-notice.scss',
  host: { role: 'status' },
})
export class StaleNotice {
  /** Whether the graph shows the last valid version instead of the current text. */
  readonly stale = input(false);

  /** The user wants to see the error. */
  readonly showInEditor = output();
}
