/** A caret position as editors show it: both values start at 1. */
export interface CaretPosition {
  line: number;
  column: number;
}

/** Line and column of a character offset (e.g. `selectionStart`) in a text. */
export function caretPosition(text: string, offset: number): CaretPosition {
  // The offset can be stale when the text was replaced from outside.
  const before = text.slice(0, Math.max(0, Math.min(offset, text.length)));
  const lineStart = before.lastIndexOf('\n') + 1;
  return {
    line: before.split('\n').length,
    column: before.length - lineStart + 1,
  };
}

/** Number of lines, counting the empty one after a trailing line break, as editors do. */
export function lineCount(text: string): number {
  return text.split('\n').length;
}
