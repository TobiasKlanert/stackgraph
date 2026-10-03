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

/** Character offset of a 1-based line and column, clamped to the text. */
export function offsetAt(text: string, line: number, column = 1): number {
  const lines = text.split('\n');
  const target = Math.min(Math.max(line, 1), lines.length);
  let offset = 0;
  for (let i = 0; i < target - 1; i++) {
    offset += (lines[i]?.length ?? 0) + 1;
  }
  const lineLength = lines[target - 1]?.length ?? 0;
  return offset + Math.min(Math.max(column, 1) - 1, lineLength);
}
