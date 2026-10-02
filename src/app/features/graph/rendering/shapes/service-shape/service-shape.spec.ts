import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ServiceGraphNode } from '../../../../../core/models/layout.model';
import { serviceSize } from '../../../../../core/layout/node-geometry';
import { ServiceShape } from './service-shape';

@Component({
  imports: [ServiceShape],
  template: `<svg><g app-service-shape [node]="node()" [selected]="selected()"></g></svg>`,
})
class Host {
  readonly node = input.required<ServiceGraphNode>();
  readonly selected = input(false);
}

function serviceNode(display: ServiceGraphNode['display']): ServiceGraphNode {
  return { id: display.name, nodeType: 'service', display, ...serviceSize(display.ports) };
}

describe('ServiceShape', () => {
  function render(node: ServiceGraphNode, selected = false): SVGGElement {
    const fixture = TestBed.createComponent(Host);
    fixture.componentRef.setInput('node', node);
    fixture.componentRef.setInput('selected', selected);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('g[app-service-shape]');
  }

  it('draws in the SVG namespace, so the browser renders it', () => {
    const shape = render(serviceNode({ name: 'api', ports: [] }));

    expect(shape.querySelector('rect')?.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('shows name, image and one chip per port', () => {
    const shape = render(
      serviceNode({ name: 'web', image: 'nginx:alpine', ports: ['80:80', '443:443'] })
    );
    const texts = Array.from(shape.querySelectorAll('text')).map((t) => t.textContent?.trim());

    expect(texts).toEqual(['web', 'nginx:alpine', '80:80', '443:443']);
    expect(shape.querySelectorAll('.chip')).toHaveLength(2);
  });

  it('sizes the body to the node', () => {
    const node = serviceNode({ name: 'web', ports: ['80:80'] });
    const body = render(node).querySelector('rect.body');

    expect(body?.getAttribute('width')).toBe(String(node.width));
    expect(body?.getAttribute('height')).toBe(String(node.height));
  });

  it('says so when a service has no image', () => {
    const image = render(serviceNode({ name: 'app', ports: [] })).querySelector('text.image');

    expect(image?.textContent?.trim()).toBe('local build');
    expect(image?.classList.contains('missing')).toBe(true);
  });

  it('shortens a long image and keeps the full text as a title', () => {
    const long = 'registry.example.com/team/very-long-image-name:1.2.3';
    const image = render(serviceNode({ name: 'app', image: long, ports: [] })).querySelector(
      'text.image'
    );

    expect(image?.textContent).toContain('…');
    expect(image?.querySelector('title')?.textContent).toBe(long);
  });

  it('adds no title when nothing was cut', () => {
    const shape = render(serviceNode({ name: 'api', image: 'node:22', ports: ['8080:8080'] }));

    expect(shape.querySelector('title')).toBeNull();
  });

  it('marks itself as selected', () => {
    const shape = render(serviceNode({ name: 'api', ports: [] }), true);

    expect(shape.classList.contains('selected')).toBe(true);
  });
});
