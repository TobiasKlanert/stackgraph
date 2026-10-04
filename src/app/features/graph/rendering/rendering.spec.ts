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

    it('should round the corners at the bend points', () => {
      const edge: StackGraphEdge = {
        ...baseEdge,
        sections: [
          {
            id: 'section1',
            startPoint: { x: 0, y: 0 },
            bendPoints: [
              { x: 0, y: 20 },
              { x: 30, y: 20 },
            ],
            endPoint: { x: 30, y: 40 },
          },
        ],
      };

      expect(component.edgePath(edge)).toBe(
        'M 0 0 L 0 12 Q 0 20 8 20 L 22 20 Q 30 20 30 28 L 30 40'
      );
    });
  });

  describe('edges', () => {
    const section = { id: 's', startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 40 } };
    const graphWithEdges: PositionedGraph = {
      id: 'root',
      children: [],
      edges: [
        {
          id: 'web->api',
          edgeType: 'dependsOn',
          sources: ['web'],
          targets: ['api'],
          sections: [section],
        },
        {
          id: 'web--net:edge',
          edgeType: 'network',
          sources: ['web'],
          targets: ['net:edge'],
          sections: [section],
        },
        {
          id: 'db--vol:data',
          edgeType: 'volume',
          sources: ['db'],
          targets: ['vol:data'],
          sections: [section],
        },
      ],
    };

    function edgePaths(): SVGPathElement[] {
      return Array.from(fixture.nativeElement.querySelectorAll('g.edges path'));
    }

    beforeEach(async () => {
      fixture.componentRef.setInput('graph', graphWithEdges);
      await fixture.whenStable();
    });

    it('styles each edge by its type', () => {
      expect(edgePaths().map((p) => p.getAttribute('class'))).toEqual([
        'edge edge--network',
        'edge edge--volume',
        'edge edge--dependsOn',
      ]);
    });

    it('draws dependencies last, so their arrows stay on top', () => {
      expect(edgePaths().at(-1)?.classList.contains('edge--dependsOn')).toBe(true);
    });

    it('puts an arrow only on dependencies', () => {
      const markers = edgePaths().map((p) => p.getAttribute('marker-end'));

      expect(markers).toEqual([null, null, 'url(#sg-arrow)']);
    });

    it('hides the edges from assistive technology', () => {
      expect(fixture.nativeElement.querySelector('g.edges')?.getAttribute('aria-hidden')).toBe(
        'true'
      );
    });
  });

  const graphWithNodes: PositionedGraph = {
    id: 'root',
    children: [
      {
        id: 'web',
        nodeType: 'service',
        display: { name: 'web', ports: [] },
        x: 0,
        y: 0,
        width: 196,
        height: 58,
      },
      {
        id: 'net:web',
        nodeType: 'network',
        display: { name: 'web' },
        x: 0,
        y: 100,
        width: 96,
        height: 52,
      },
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

    it('selects a service with the space key and keeps the page from scrolling', () => {
      let emitted: string | null = null;
      component.nodeSelected.subscribe((id) => (emitted = id));
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });

      nodeEl('web').dispatchEvent(event);

      expect(emitted).toBe('web');
      expect(event.defaultPrevented).toBe(true);
    });

    it('describes services as toggle buttons with name and image', async () => {
      fixture.componentRef.setInput('selectedId', 'web');
      await fixture.whenStable();

      expect(nodeEl('web').getAttribute('aria-pressed')).toBe('true');
      expect(nodeEl('web').getAttribute('aria-label')).toBe('web, local build');
      expect(nodeEl('net:web').hasAttribute('aria-pressed')).toBe(false);
    });

    /** Simulates focus as the browser classifies it: keyboard (visible) or pointer. */
    function focusNode(id: string, visible: boolean): void {
      const el = nodeEl(id);
      // jsdom does not apply :focus-visible while the focus event is dispatched.
      // defineProperty instead of an assignment: newer DOM typings declare
      // matches() with type-predicate overloads that a plain function cannot satisfy.
      Object.defineProperty(el, 'matches', {
        value: (selector: string) => selector === ':focus-visible' && visible,
      });
      el.dispatchEvent(new FocusEvent('focus'));
    }

    it('draws a focus ring for keyboard focus and removes it on blur', async () => {
      focusNode('web', true);
      await fixture.whenStable();

      expect(nodeEl('web').querySelector('.focus-ring')).not.toBeNull();

      nodeEl('web').dispatchEvent(new FocusEvent('blur'));
      await fixture.whenStable();

      expect(nodeEl('web').querySelector('.focus-ring')).toBeNull();
    });

    it('draws no focus ring when a click focused the node', async () => {
      focusNode('web', false);
      await fixture.whenStable();

      expect(nodeEl('web').querySelector('.focus-ring')).toBeNull();
    });

    it('clears the selection on Escape', () => {
      let cleared = 0;
      component.selectionCleared.subscribe(() => cleared++);

      fixture.nativeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );

      expect(cleared).toBe(1);
    });

    it('clears the selection on a click on the background, not on a node', () => {
      let cleared = 0;
      component.selectionCleared.subscribe(() => cleared++);

      nodeEl('web').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(cleared).toBe(0);

      fixture.nativeElement
        .querySelector('svg')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(cleared).toBe(1);
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

    it('positions each node at its layout coordinates', () => {
      expect(nodeEl('net:web').getAttribute('transform')).toBe('translate(0 100)');
    });

    it('draws each node type with its own shape', () => {
      expect(nodeEl('web').querySelector('[app-service-shape]')).not.toBeNull();
      expect(nodeEl('net:web').querySelector('[app-network-shape]')).not.toBeNull();
    });
  });
});
