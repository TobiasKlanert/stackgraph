import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { ComposeState } from '../../../core/state/compose-state';
import { caretPosition, lineCount, offsetAt } from './text-position';

/**
 * Code field for the compose file: line numbers, caret position, "go to line".
 * The header above it belongs to the page (tab in the split view, label and
 * status on the home page) and is projected via `[editorHeader]`.
 */
@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor {
  protected readonly state = inject(ComposeState);

  /** Accessible name of the textarea; the visible header is up to the page. */
  readonly label = input.required<string>();

  /** Hint shown while the field is empty. */
  readonly placeholder = input<string>();

  /** Id of a note that describes the field, e.g. the privacy note on the home page. */
  readonly describedBy = input<string>();

  private readonly textarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('input');
  private readonly caretOffset = signal(0);
  private readonly scrollTop = signal(0);

  /** Line and column of the caret, for the status bar below the editor. */
  readonly caret = computed(() => caretPosition(this.state.source(), this.caretOffset()));

  protected readonly lineNumbers = computed(() =>
    Array.from({ length: lineCount(this.state.source()) }, (_, i) => i + 1)
  );

  /** The gutter does not scroll itself; it follows the textarea. */
  protected readonly gutterOffset = computed(() => `translateY(${-this.scrollTop()}px)`);

  /**
   * Puts the caret at a position and scrolls its line into view, a third
   * down from the top rather than at the very edge. Used by "Go to line".
   */
  goTo(line: number, column = 1): void {
    const textarea = this.textarea().nativeElement;
    const offset = offsetAt(textarea.value, line, column);
    textarea.focus();
    textarea.setSelectionRange(offset, offset);
    // Read from CSS so the rhythm is defined in one place (editor.scss).
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
    textarea.scrollTop = Math.max(0, (line - 1) * lineHeight - textarea.clientHeight / 3);
    this.trackCaret(textarea);
    this.onScroll(textarea);
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.state.source.set(target.value);
    this.trackCaret(target);
  }

  protected onScroll(textarea: HTMLTextAreaElement): void {
    this.scrollTop.set(textarea.scrollTop);
  }

  /** The caret is the moving end of the selection, as in other editors. */
  protected trackCaret(textarea: HTMLTextAreaElement): void {
    this.caretOffset.set(
      textarea.selectionDirection === 'backward' ? textarea.selectionStart : textarea.selectionEnd
    );
  }
}
