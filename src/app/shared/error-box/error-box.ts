import { Component, input, output } from '@angular/core';
import { ParseError } from '../../core/models/compose.model';
import { asSentence, fixHint } from '../../core/parser/error-hints';

export interface TextPosition {
  line: number;
  column: number;
}

/**
 * Explains parse errors: where, what, how to fix. Not a live region on
 * purpose; the status bar announces the error count, the details are here
 * to read and to jump to.
 */
@Component({
  selector: 'app-error-box',
  templateUrl: './error-box.html',
  styleUrl: './error-box.scss',
})
export class ErrorBox {
  readonly errors = input.required<readonly ParseError[]>();

  /** "Go to line" was pressed; the page moves the editor caret there. */
  readonly goTo = output<TextPosition>();

  protected readonly asSentence = asSentence;
  protected readonly fixHint = fixHint;

  protected title(error: ParseError): string {
    if (error.line === undefined) {
      return 'Invalid Compose file';
    }
    const column = error.column === undefined ? '' : `, column ${error.column}`;
    return `Invalid YAML on line ${error.line}${column}`;
  }
}
