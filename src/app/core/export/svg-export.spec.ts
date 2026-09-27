import { TestBed } from '@angular/core/testing';
import { SvgExport } from './svg-export';

const svgNs = 'http://www.w3.org/2000/svg';

describe('SvgExport', () => {
  let service: SvgExport;
  let svg: SVGSVGElement;

  /** Builds a minimal stand-in for the rendered graph: a zoomed group with two nodes. */
  function createSvg(): SVGSVGElement {
    const root = document.createElementNS(svgNs, 'svg');
    root.setAttribute('viewBox', '0 0 400 300');

    const group = document.createElementNS(svgNs, 'g');
    group.setAttribute('transform', 'translate(12,34) scale(2)');

    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', 'M 0 0 L 10 20');
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
      node.appendChild(text);

      group.appendChild(node);
    }

    root.appendChild(group);
    return root;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SvgExport);

    svg = createSvg();
    document.body.appendChild(svg);
  });

  afterEach(() => {
    svg.remove();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('declares the svg namespace', () => {
    expect(service.toSvgString(svg)).toContain('http://www.w3.org/2000/svg');
  });

  it('drops the zoom transform so the export shows the whole graph', () => {
    expect(service.toSvgString(svg)).not.toContain('translate(12,34)');
  });

  it('takes width and height from the viewBox', () => {
    const result = service.toSvgString(svg);

    expect(result).toContain('width="400"');
    expect(result).toContain('height="300"');
  });

  it('keeps every node of the graph', () => {
    const result = service.toSvgString(svg);

    expect(result).toContain('data-node-id="web"');
    expect(result).toContain('data-node-id="api"');
    expect(result.match(/<rect/g)).toHaveLength(2);
  });

  it('leaves the live element untouched', () => {
    service.toSvgString(svg);

    expect(svg.querySelector('g')?.getAttribute('transform')).toBe('translate(12,34) scale(2)');
  });

  it('writes the style properties as attributes', () => {
    const result = service.toSvgString(svg);

    expect(result).toContain('fill=');
  });
});
