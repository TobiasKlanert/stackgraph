import { TestBed } from '@angular/core/testing';
import { SvgExport } from './svg-export';

const svgNs = 'http://www.w3.org/2000/svg';

describe('SvgExport', () => {
  let service: SvgExport;
  let host: HTMLDivElement;
  let svg: SVGSVGElement;

  /** Builds a minimal stand-in for the rendered graph: a zoomed group with two nodes. */
  function createSvg(): SVGSVGElement {
    const root = document.createElementNS(svgNs, 'svg');
    root.setAttribute('viewBox', '0 0 400 300');

    const group = document.createElementNS(svgNs, 'g');
    group.setAttribute('transform', 'translate(12,34) scale(2)');

    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', 'M 0 0 L 10 20');
    path.style.setProperty('stroke-dasharray', '6 4');
    group.appendChild(path);

    for (const id of ['web', 'api']) {
      const node = document.createElementNS(svgNs, 'g');
      node.setAttribute('data-node-id', id);

      const rect = document.createElementNS(svgNs, 'rect');
      rect.setAttribute('width', '160');
      rect.setAttribute('height', '64');
      node.appendChild(rect);

      const text = document.createElementNS(svgNs, 'text');
      text.textContent = id;
      text.style.setProperty('font-weight', '600');
      node.appendChild(text);

      group.appendChild(node);
    }

    root.appendChild(group);
    return root;
  }

  /** Parses the export back into a DOM, so tests can query it like the app does. */
  function exported(): SVGSVGElement {
    const doc = new DOMParser().parseFromString(service.toSvgString(svg), 'image/svg+xml');
    return doc.documentElement as unknown as SVGSVGElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SvgExport);

    host = document.createElement('div');
    svg = createSvg();
    host.appendChild(svg);
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('declares the svg namespace exactly once, so the file is valid XML', () => {
    const result = service.toSvgString(svg);

    expect(result.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g)).toHaveLength(1);
    expect(exported().tagName).toBe('svg');
  });

  it('drops the zoom transform so the export shows the whole graph', () => {
    expect(service.toSvgString(svg)).not.toContain('translate(12,34)');
  });

  it('adds a margin around the graph and sizes the file to match', () => {
    const root = exported();

    expect(root.getAttribute('viewBox')).toBe('-16 -16 432 332');
    expect(root.getAttribute('width')).toBe('432');
    expect(root.getAttribute('height')).toBe('332');
  });

  it('keeps every node of the graph', () => {
    const root = exported();

    expect(root.querySelector('[data-node-id="web"] rect')).not.toBeNull();
    expect(root.querySelector('[data-node-id="api"] rect')).not.toBeNull();
  });

  it('leaves the live element untouched', () => {
    service.toSvgString(svg);

    expect(svg.querySelector('g')?.getAttribute('transform')).toBe('translate(12,34) scale(2)');
  });

  it('writes line patterns and font weights as attributes', () => {
    const root = exported();

    expect(root.querySelector('path')?.getAttribute('stroke-dasharray')).toBe('6 4');
    expect(root.querySelector('text')?.getAttribute('font-weight')).toBe('600');
  });

  it('writes opacity only where it is not fully opaque', () => {
    svg.querySelector('path')?.style.setProperty('opacity', '0.5');
    const root = exported();

    expect(root.querySelector('path')?.getAttribute('opacity')).toBe('0.5');
    expect(root.querySelector('rect')?.hasAttribute('opacity')).toBe(false);
  });

  describe('background', () => {
    it('lays the colour behind the graph under the whole frame', () => {
      host.style.backgroundColor = 'rgb(10, 13, 18)';
      const first = exported().firstElementChild;

      expect(first?.tagName).toBe('rect');
      expect(first?.getAttribute('fill')).toBe('rgb(10, 13, 18)');
      expect(first?.getAttribute('x')).toBe('-16');
      expect(first?.getAttribute('width')).toBe('432');
    });

    it('stays transparent when nothing behind the graph has a colour', () => {
      expect(exported().firstElementChild?.tagName).toBe('g');
    });
  });

  describe('live-only parts', () => {
    it('drops the keyboard focus ring', () => {
      const ring = document.createElementNS(svgNs, 'rect');
      ring.setAttribute('class', 'focus-ring');
      svg.querySelector('[data-node-id="web"]')?.appendChild(ring);

      expect(exported().querySelector('.focus-ring')).toBeNull();
    });

    it('drops interaction attributes but keeps image roles', () => {
      const web = svg.querySelector('[data-node-id="web"]');
      web?.setAttribute('tabindex', '0');
      web?.setAttribute('role', 'button');
      web?.setAttribute('aria-pressed', 'true');
      svg.querySelector('[data-node-id="api"]')?.setAttribute('role', 'img');

      const root = exported();
      const exportedWeb = root.querySelector('[data-node-id="web"]');

      expect(exportedWeb?.hasAttribute('tabindex')).toBe(false);
      expect(exportedWeb?.hasAttribute('role')).toBe(false);
      expect(exportedWeb?.hasAttribute('aria-pressed')).toBe(false);
      expect(root.querySelector('[data-node-id="api"]')?.getAttribute('role')).toBe('img');
    });

    it('drops Angular attributes and template comments', () => {
      svg.querySelector('g')?.setAttribute('_ngcontent-ng-c123', '');
      svg.querySelector('g')?.appendChild(document.createComment('container'));

      const result = service.toSvgString(svg);

      expect(result).not.toContain('_ngcontent');
      expect(result).not.toContain('<!--');
    });
  });
});
