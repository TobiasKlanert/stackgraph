import { caretPosition, lineCount } from './text-position';

describe('caretPosition', () => {
  const text = 'services:\n  web:\n    image: nginx';

  it('starts at line 1, column 1', () => {
    expect(caretPosition(text, 0)).toEqual({ line: 1, column: 1 });
  });

  it('counts the column within the line', () => {
    expect(caretPosition(text, 4)).toEqual({ line: 1, column: 5 });
  });

  it('puts an offset right after a line break at the start of the next line', () => {
    expect(caretPosition(text, 10)).toEqual({ line: 2, column: 1 });
  });

  it('places the end of the text after its last character', () => {
    expect(caretPosition(text, text.length)).toEqual({ line: 3, column: 17 });
  });

  it('clamps offsets outside the text', () => {
    expect(caretPosition(text, 999)).toEqual({ line: 3, column: 17 });
    expect(caretPosition(text, -5)).toEqual({ line: 1, column: 1 });
  });
});

describe('lineCount', () => {
  it('has one line for empty text', () => {
    expect(lineCount('')).toBe(1);
  });

  it('counts the empty line after a trailing line break', () => {
    expect(lineCount('a\nb')).toBe(2);
    expect(lineCount('a\nb\n')).toBe(3);
  });
});
