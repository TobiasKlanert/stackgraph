import { Component, input } from '@angular/core';
import { ParseState } from '../../core/state/compose-state';

@Component({
  selector: 'app-status-panel',
  imports: [],
  templateUrl: './status-panel.html',
  styleUrl: './status-panel.scss',
})
export class StatusPanel {
  readonly status = input.required<ParseState>();
}
