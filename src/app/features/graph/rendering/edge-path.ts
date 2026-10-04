export interface Point {
  x: number;
  y: number;
}

/**
 * SVG path through the given points with rounded corners. Each corner is
 * replaced by a quadratic curve; the radius shrinks on short segments so
 * two neighbouring curves never overlap.
 */
export function roundedPath(points: readonly Point[], radius = 8): string {
  const [first] = points;
  if (first === undefined) {
    return '';
  }

  const segments = [`M ${fmt(first.x)} ${fmt(first.y)}`];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const corner = points[i];
    const next = points[i + 1];
    if (prev === undefined || corner === undefined) {
      continue;
    }
    // The last point and straight continuations get a plain line.
    if (next === undefined || isStraight(prev, corner, next)) {
      segments.push(`L ${fmt(corner.x)} ${fmt(corner.y)}`);
      continue;
    }

    const inLength = Math.hypot(corner.x - prev.x, corner.y - prev.y);
    const outLength = Math.hypot(next.x - corner.x, next.y - corner.y);
    const r = Math.min(radius, inLength / 2, outLength / 2);

    const enterX = corner.x - ((corner.x - prev.x) / inLength) * r;
    const enterY = corner.y - ((corner.y - prev.y) / inLength) * r;
    const leaveX = corner.x + ((next.x - corner.x) / outLength) * r;
    const leaveY = corner.y + ((next.y - corner.y) / outLength) * r;

    segments.push(
      `L ${fmt(enterX)} ${fmt(enterY)}`,
      `Q ${fmt(corner.x)} ${fmt(corner.y)} ${fmt(leaveX)} ${fmt(leaveY)}`
    );
  }

  return segments.join(' ');
}

/** Collinear points (or zero-length segments) have no corner to round. */
function isStraight(a: Point, b: Point, c: Point): boolean {
  return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) === 0;
}

/** Two decimals keep the path short without visible loss. */
function fmt(value: number): number {
  return Math.round(value * 100) / 100;
}
