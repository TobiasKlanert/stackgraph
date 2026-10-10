import { isPlainClick } from './is-plain-click';

describe('isPlainClick', () => {
  it('accepts a primary click without modifiers', () => {
    expect(isPlainClick(new MouseEvent('click', { button: 0 }))).toBe(true);
  });

  it.each(['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const)(
    'rejects a click with %s',
    (key) => {
      expect(isPlainClick(new MouseEvent('click', { button: 0, [key]: true }))).toBe(false);
    }
  );

  it('rejects the middle button', () => {
    expect(isPlainClick(new MouseEvent('click', { button: 1 }))).toBe(false);
  });
});
