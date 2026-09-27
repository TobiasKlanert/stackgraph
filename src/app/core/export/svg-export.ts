import { Injectable } from '@angular/core';

const styleProps = ['fill', 'stroke', 'stroke-width', 'font-family', 'font-size'] as const;

@Injectable({ providedIn: 'root' })
export class SvgExport {
  toSvgString(svg: SVGSVGElement): string {
    const clone = svg.cloneNode(true) as SVGSVGElement;

    this.copyStyles(svg, clone);

    const sourceElements = svg.querySelectorAll('*');
    const cloneElements = clone.querySelectorAll('*');

    for (const [index, sourceEl] of sourceElements.entries()) {
      const cloneEl = cloneElements[index];
      if (cloneEl !== undefined) {
        this.copyStyles(sourceEl, cloneEl);
      }
    }

    const group = clone.querySelector('g');
    group?.removeAttribute('transform');

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const viewBox = clone.getAttribute('viewBox');
    if (viewBox !== null) {
      const [, , width, height] = viewBox.split(' ');
      if (width !== undefined && height !== undefined) {
        clone.setAttribute('width', width);
        clone.setAttribute('height', height);
      }
    }

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

  private copyStyles(source: Element, target: Element): void {
    const computed = getComputedStyle(source);
    for (const prop of styleProps) {
      target.setAttribute(prop, computed.getPropertyValue(prop));
    }
  }
}
