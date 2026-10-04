import { formatDuration } from './format-duration';

describe('formatDuration', () => {
  it('rounds to whole milliseconds', () => {
    expect(formatDuration(4.4)).toBe('4 ms');
    expect(formatDuration(4.5)).toBe('5 ms');
  });

  it('does not claim zero time for very fast runs', () => {
    expect(formatDuration(0)).toBe('< 1 ms');
    expect(formatDuration(0.6)).toBe('< 1 ms');
  });

  it('shows exactly one millisecond as such', () => {
    expect(formatDuration(1)).toBe('1 ms');
  });
});
