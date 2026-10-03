import { Injectable } from '@angular/core';

const svgNs = 'http://www.w3.org/2000/svg';

/**
 * Computed styles copied onto the export as presentation attributes. The
 * live graph is styled through CSS and theme tokens, neither of which
 * travels with a standalone file.
 */
const styleProps = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
] as const;

type StyleProp = (typeof styleProps)[number];

/**
 * All of the above inherit except opacity. An inherited value equal to the
 * parent's is reproduced by inheritance in the file and need not be
 * written again, which keeps the export small.
 */
const nonInherited: ReadonlySet<StyleProp> = new Set(['opacity']);

/** Room around the outermost nodes, so the selection halo is not cut off. */
const margin = 16;

/** Attributes that only matter to the live, interactive graph. */
const interactiveAttributes = ['tabindex', 'aria-pressed'];

@Injectable({ providedIn: 'root' })
export class SvgExport {
  toSvgString(svg: SVGSVGElement): string {
    const clone = svg.cloneNode(true) as SVGSVGElement;

    // Styles first: the clone still mirrors the live tree element by element.
    this.copyStyles(svg, clone);
    this.removeLiveOnlyParts(clone);

    const group = clone.querySelector('g');
    group?.removeAttribute('transform');

    // A real namespace declaration rather than a plain attribute, which some
    // serializers (jsdom among them) would emit next to their own: invalid XML.
    clone.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', svgNs);
    this.frame(clone, backgroundBehind(svg));

    return new XMLSerializer().serializeToString(clone);
  }

  download(svg: SVGSVGElement, fileName: string): void {
    const source = this.toSvgString(svg);

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');

    downloadLink.href = url;
    downloadLink.download = fileName;

    downloadLink.click();

    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private copyStyles(source: SVGSVGElement, clone: SVGSVGElement): void {
    const sources = [source, ...Array.from(source.querySelectorAll('*'))];
    const targets = [clone, ...Array.from(clone.querySelectorAll('*'))];
    const computed = new Map<Element, CSSStyleDeclaration>();
    const styleOf = (el: Element) => {
      let style = computed.get(el);
      if (style === undefined) {
        style = getComputedStyle(el);
        computed.set(el, style);
      }
      return style;
    };

    sources.forEach((sourceEl, index) => {
      const target = targets[index];
      if (target === undefined) {
        return;
      }
      const own = styleOf(sourceEl);
      const parent = sourceEl === source ? null : sourceEl.parentElement;
      const inherited = parent === null ? null : styleOf(parent);

      for (const prop of styleProps) {
        const value = own.getPropertyValue(prop);
        if (value === '') {
          continue;
        }
        if (nonInherited.has(prop)) {
          if (value !== '1') {
            target.setAttribute(prop, value);
          }
          continue;
        }
        if (inherited === null || inherited.getPropertyValue(prop) !== value) {
          target.setAttribute(prop, value);
        }
      }
    });
  }

  /** Drops what belongs to the running app: focus ring, Angular markers, interaction. */
  private removeLiveOnlyParts(clone: SVGSVGElement): void {
    clone.querySelectorAll('.focus-ring').forEach((el) => el.remove());

    for (const el of [clone, ...Array.from(clone.querySelectorAll('*'))]) {
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('_ng') || attr.name.startsWith('ng-reflect')) {
          el.removeAttribute(attr.name);
        }
      }
      for (const name of interactiveAttributes) {
        el.removeAttribute(name);
      }
      if (el.getAttribute('role') === 'button') {
        el.removeAttribute('role');
      }
    }

    const comments = clone.ownerDocument.createTreeWalker(clone, NodeFilter.SHOW_COMMENT);
    const found: Node[] = [];
    while (comments.nextNode()) {
      found.push(comments.currentNode);
    }
    found.forEach((comment) => comment.parentNode?.removeChild(comment));
  }

  /** Widens the viewBox by the margin and lays the canvas colour underneath. */
  private frame(clone: SVGSVGElement, background: string | null): void {
    const viewBox = clone
      .getAttribute('viewBox')
      ?.split(/[\s,]+/)
      .map(Number);
    if (viewBox?.length !== 4 || viewBox.some(Number.isNaN)) {
      return;
    }
    const [x = 0, y = 0, width = 0, height = 0] = viewBox;
    const framed = [x - margin, y - margin, width + 2 * margin, height + 2 * margin];

    clone.setAttribute('viewBox', framed.join(' '));
    clone.setAttribute('width', String(framed[2]));
    clone.setAttribute('height', String(framed[3]));

    if (background !== null) {
      const rect = clone.ownerDocument.createElementNS(svgNs, 'rect');
      rect.setAttribute('x', String(framed[0]));
      rect.setAttribute('y', String(framed[1]));
      rect.setAttribute('width', String(framed[2]));
      rect.setAttribute('height', String(framed[3]));
      rect.setAttribute('fill', background);
      clone.insertBefore(rect, clone.firstChild);
    }
  }
}

/**
 * The colour the graph is drawn on: the first opaque background up the
 * tree. Read from the page rather than a token name, so the export follows
 * whatever theme and layout currently surround the graph.
 */
function backgroundBehind(el: Element): string | null {
  for (let node: Element | null = el; node !== null; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor;
    if (color !== '' && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
      return color;
    }
  }
  return null;
}
