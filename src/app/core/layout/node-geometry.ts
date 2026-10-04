/**
 * Node geometry, shared by the ELK mapping (sizes before layout) and the
 * node components (positions inside a node). One source, so a node is drawn
 * exactly as large as ELK planned it.
 *
 * Text widths are computed, not measured, so the mapping stays a pure
 * function. JetBrains Mono advances every glyph by exactly 0.6 em, so image
 * and port widths are exact. Inter is proportional; its factor is a
 * deliberately generous average, so estimated text errs wide, never over
 * the edge.
 */

const monoAdvance = 0.6;
const sansAdvance = 0.62;

export const serviceGeometry = {
  width: 196,
  paddingX: 14,
  nameBaseline: 24,
  nameFontSize: 14,
  imageBaseline: 42,
  imageFontSize: 11,
  chipTop: 51,
  chipHeight: 16,
  chipGap: 6,
  chipPaddingX: 6,
  chipFontSize: 10.5,
  bottomPadding: 9,
  heightWithoutPorts: 58,
} as const;

export const networkGeometry = {
  minWidth: 96,
  maxWidth: 220,
  height: 52,
  /** Horizontal run of the slanted hexagon sides. */
  slant: 14,
  paddingX: 10,
  labelFontSize: 12.5,
} as const;

export const volumeGeometry = {
  minWidth: 100,
  maxWidth: 220,
  height: 60,
  /** Vertical radius of the elliptical caps. */
  capHeight: 8,
  paddingX: 14,
  labelFontSize: 12.5,
} as const;

export interface Size {
  width: number;
  height: number;
}

export interface ChipBox {
  text: string;
  x: number;
  y: number;
  width: number;
}

export function monoCharWidth(fontSize: number): number {
  return fontSize * monoAdvance;
}

export function sansCharWidth(fontSize: number): number {
  return fontSize * sansAdvance;
}

/** Shortens text to fit maxWidth and marks the cut with an ellipsis. */
export function truncate(text: string, maxWidth: number, charWidth: number): string {
  // The epsilon absorbs float noise: 56.7 / 6.3 is 8.999…, which would
  // otherwise cut a text that fits exactly.
  const maxChars = Math.floor(maxWidth / charWidth + 1e-9);
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxChars - 1))}…`;
}

/** Content width available inside a service node. */
export const serviceContentWidth = serviceGeometry.width - 2 * serviceGeometry.paddingX;

/**
 * Port chips flow left to right and wrap into further rows. Positions are
 * relative to the node's top-left corner.
 */
export function layoutPortChips(ports: readonly string[]): ChipBox[] {
  const g = serviceGeometry;
  const left = g.paddingX;
  const right = g.width - g.paddingX;
  const charWidth = monoCharWidth(g.chipFontSize);

  let x = left;
  let y = g.chipTop;

  return ports.map((text) => {
    const width = Math.min(text.length * charWidth + 2 * g.chipPaddingX, serviceContentWidth);
    if (x > left && x + width > right) {
      x = left;
      y += g.chipHeight + g.chipGap;
    }
    const box: ChipBox = { text, x, y, width };
    x += width + g.chipGap;
    return box;
  });
}

export function serviceSize(ports: readonly string[]): Size {
  const g = serviceGeometry;
  const chips = layoutPortChips(ports);
  if (chips.length === 0) {
    return { width: g.width, height: g.heightWithoutPorts };
  }
  const lastRowTop = Math.max(...chips.map((chip) => chip.y));
  return { width: g.width, height: lastRowTop + g.chipHeight + g.bottomPadding };
}

/** Space for the label between the slanted sides. */
export function networkLabelWidth(nodeWidth: number): number {
  const g = networkGeometry;
  return nodeWidth - 2 * (g.slant + g.paddingX);
}

export function networkSize(name: string): Size {
  const g = networkGeometry;
  const text = name.length * sansCharWidth(g.labelFontSize);
  const width = clamp(text + 2 * (g.slant + g.paddingX), g.minWidth, g.maxWidth);
  return { width, height: g.height };
}

export function volumeLabelWidth(nodeWidth: number): number {
  return nodeWidth - 2 * volumeGeometry.paddingX;
}

export function volumeSize(name: string): Size {
  const g = volumeGeometry;
  const text = name.length * sansCharWidth(g.labelFontSize);
  const width = clamp(text + 2 * g.paddingX, g.minWidth, g.maxWidth);
  return { width, height: g.height };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
