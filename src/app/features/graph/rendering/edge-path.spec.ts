import { roundedPath } from './edge-path';

describe('roundedPath', () => {
  it('returns nothing without points', () => {
    expect(roundedPath([])).toBe('');
  });

  it('draws a straight line between two points', () => {
    expect(
      roundedPath([
        { x: 0, y: 0 },
        { x: 10, y: 20 },
      ])
    ).toBe('M 0 0 L 10 20');
  });

  it('rounds a right-angle corner with the given radius', () => {
    const path = roundedPath(
      [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 50, y: 50 },
      ],
      8
    );

    expect(path).toBe('M 0 0 L 0 42 Q 0 50 8 50 L 50 50');
  });

  it('shrinks the radius on short segments, so curves never overlap', () => {
    const path = roundedPath(
      [
        { x: 0, y: 0 },
        { x: 0, y: 6 },
        { x: 50, y: 6 },
      ],
      8
    );

    expect(path).toBe('M 0 0 L 0 3 Q 0 6 3 6 L 50 6');
  });

  it('leaves points on a straight line as plain line segments', () => {
    const path = roundedPath([
      { x: 0, y: 0 },
      { x: 0, y: 20 },
      { x: 0, y: 40 },
    ]);

    expect(path).toBe('M 0 0 L 0 20 L 0 40');
  });

  it('keeps coordinates to two decimals', () => {
    expect(
      roundedPath([
        { x: 0.123456, y: 0 },
        { x: 10, y: 20.987654 },
      ])
    ).toBe('M 0.12 0 L 10 20.99');
  });
});
