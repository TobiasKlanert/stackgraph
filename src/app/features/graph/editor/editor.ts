import { Component, computed, inject, signal } from '@angular/core';
import { ComposeState } from '../../../core/state/compose-state';
import { caretPosition, lineCount } from './text-position';

@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor {
  protected readonly state = inject(ComposeState);

  private readonly caretOffset = signal(0);
  private readonly scrollTop = signal(0);

  /** Line and column of the caret, for the status bar below the editor. */
  readonly caret = computed(() => caretPosition(this.state.source(), this.caretOffset()));

  protected readonly lineNumbers = computed(() =>
    Array.from({ length: lineCount(this.state.source()) }, (_, i) => i + 1)
  );

  /** The gutter does not scroll itself; it follows the textarea. */
  protected readonly gutterOffset = computed(() => `translateY(${-this.scrollTop()}px)`);

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
