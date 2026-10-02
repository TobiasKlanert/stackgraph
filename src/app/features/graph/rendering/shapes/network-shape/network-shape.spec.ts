import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NetworkGraphNode } from '../../../../../core/models/layout.model';
import { networkSize } from '../../../../../core/layout/node-geometry';
import { NetworkShape } from './network-shape';

@Component({
  imports: [NetworkShape],
  template: `<svg><g app-network-shape [node]="node()"></g></svg>`,
})
class Host {
  readonly node = input.required<NetworkGraphNode>();
}

describe('NetworkShape', () => {
  function render(name: string): SVGGElement {
    const node: NetworkGraphNode = {
      id: `net:${name}`,
      nodeType: 'network',
      display: { name },
      ...networkSize(name),
    };
    const fixture = TestBed.createComponent(Host);
    fixture.componentRef.setInput('node', node);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('g[app-network-shape]');
  }

  it('draws a hexagon spanning the node', () => {
    const points = render('edge').querySelector('polygon')?.getAttribute('points');

    expect(points).toBe('0,26 14,0 82,0 96,26 82,52 14,52');
  });

  it('labels the shape for assistive technology', () => {
    const shape = render('backend');

    expect(shape.getAttribute('role')).toBe('img');
    expect(shape.getAttribute('aria-label')).toBe('backend network');
    expect(shape.querySelector('text')?.textContent?.trim()).toBe('backend');
  });
});
