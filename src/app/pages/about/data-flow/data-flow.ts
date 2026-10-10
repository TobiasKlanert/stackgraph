import { Component } from '@angular/core';

/**
 * The typed result each pipeline step hands to the next. Four fixed
 * stations, so the content lives in the template; the spec checks the code
 * names in it against the real exports.
 */
@Component({
  selector: 'app-data-flow',
  templateUrl: './data-flow.html',
  styleUrl: './data-flow.scss',
})
export class DataFlow {}
