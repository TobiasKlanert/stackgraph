import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rendering } from './rendering';
import { PositionedGraph, StackGraphEdge } from '../../../core/models/layout.model';

describe('Rendering', () => {
  let component: Rendering;
  let fixture: ComponentFixture<Rendering>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rendering],
    }).compileComponents();

    fixture = TestBed.createComponent(Rendering);
    component = fixture.componentInstance;

    const mockGraph: PositionedGraph = { id: 'root', children: [], edges: [] };

    fixture.componentRef.setInput('graph', mockGraph);

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('edgePath', () => {
    const baseEdge: StackGraphEdge = {
      id: 'edge1',
      edgeType: 'dependsOn',
      sources: ['a'],
      targets: ['b'],
    };

    it('should return an empty string when the edge has no sections', () => {
      expect(component.edgePath(baseEdge)).toBe('');
    });

    it('should return an empty string when sections is empty', () => {
      const edge: StackGraphEdge = { ...baseEdge, sections: [] };

      expect(component.edgePath(edge)).toBe('');
    });

    it('should build a straight line from start and end point when there are no bend points', () => {
      const edge: StackGraphEdge = {
        ...baseEdge,
        sections: [
          {
            id: 'section1',
            startPoint: { x: 0, y: 0 },
            endPoint: { x: 10, y: 20 },
          },
        ],
      };

      expect(component.edgePath(edge)).toBe('M 0 0 L 10 20');
    });

    it('should build a chained path through the bend points when present', () => {
      const edge: StackGraphEdge = {
        ...baseEdge,
        sections: [
          {
            id: 'section1',
            startPoint: { x: 0, y: 0 },
            bendPoints: [
              { x: 5, y: 5 },
              { x: 15, y: 5 },
            ],
            endPoint: { x: 20, y: 10 },
          },
        ],
      };

      expect(component.edgePath(edge)).toBe('M 0 0 L 5 5 L 15 5 L 20 10');
    });
  });

  const graphWithNodes: PositionedGraph = {
    id: 'root',
    children: [
      { id: 'web', nodeType: 'service', x: 0, y: 0, width: 160, height: 64 },
      { id: 'net:web', nodeType: 'network', x: 0, y: 100, width: 160, height: 64 },
    ],
    edges: [],
  };

  function nodeEl(id: string): SVGGElement {
    const el = fixture.nativeElement.querySelector(`[data-node-id="${id}"]`);
    expect(el).not.toBeNull();
    return el as SVGGElement;
  }

  describe('node selection', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('graph', graphWithNodes);
      await fixture.whenStable();
    });

    it('emits the node id when a service node is clicked', () => {
      let emitted: string | null = null;
      component.nodeSelected.subscribe((id) => (emitted = id));

      nodeEl('web').dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(emitted).toBe('web');
    });

    it('does not emit when a non-service node is clicked', () => {
      let emitted: string | null = null;
      component.nodeSelected.subscribe((id) => (emitted = id));

      nodeEl('net:web').dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(emitted).toBeNull();
    });

    it('emits when a click originates on a child element of the node', () => {
      let emitted: string | null = null;
      component.nodeSelected.subscribe((id) => (emitted = id));

      const rect = nodeEl('web').querySelector('rect');
      rect?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(emitted).toBe('web');
    });

    it('marks only the selected node', async () => {
      fixture.componentRef.setInput('selectedId', 'web');
      await fixture.whenStable();

      expect(nodeEl('web').classList.contains('selected')).toBe(true);
      expect(nodeEl('net:web').classList.contains('selected')).toBe(false);
    });

    it('makes only service nodes focusable', () => {
      expect(nodeEl('web').getAttribute('tabindex')).toBe('0');
      expect(nodeEl('net:web').getAttribute('tabindex')).toBeNull();
    });
  });
});
