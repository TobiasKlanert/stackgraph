import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VolumeGraphNode } from '../../../../../core/models/layout.model';
import { volumeSize } from '../../../../../core/layout/node-geometry';
import { VolumeShape } from './volume-shape';

@Component({
  imports: [VolumeShape],
  template: `<svg><g app-volume-shape [node]="node()"></g></svg>`,
})
class Host {
  readonly node = input.required<VolumeGraphNode>();
}

describe('VolumeShape', () => {
  function render(name: string): SVGGElement {
    const node: VolumeGraphNode = {
      id: `vol:${name}`,
      nodeType: 'volume',
      display: { name },
      ...volumeSize(name),
    };
    const fixture = TestBed.createComponent(Host);
    fixture.componentRef.setInput('node', node);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('g[app-volume-shape]');
  }

  it('draws a cylinder from body and lid', () => {
    const shape = render('pgdata');

    expect(shape.querySelector('path.shape')?.getAttribute('d')).toBe(
      'M0 8 A50 8 0 0 1 100 8 V52 A50 8 0 0 1 0 52 Z'
    );
    expect(shape.querySelector('path.lid')?.getAttribute('d')).toBe('M0 8 A50 8 0 0 0 100 8');
  });

  it('labels the shape for assistive technology', () => {
    const shape = render('pgdata');

    expect(shape.getAttribute('role')).toBe('img');
    expect(shape.getAttribute('aria-label')).toBe('pgdata volume');
  });
});
