import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphPage } from './graph-page';

describe('GraphPage', () => {
  let fixture: ComponentFixture<GraphPage>;

  function panel(): HTMLElement | null {
    return fixture.nativeElement.querySelector('app-detail-panel');
  }

  function clickNode(id: string): void {
    const el = fixture.nativeElement.querySelector(`[data-node-id="${id}"]`);
    expect(el).not.toBeNull();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GraphPage] }).compileComponents();
    fixture = TestBed.createComponent(GraphPage);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('shows no detail panel before a node is selected', () => {
    expect(panel()).toBeNull();
  });

  it('shows the detail panel for the clicked service', async () => {
    clickNode('web');
    await fixture.whenStable();

    expect(panel()?.textContent).toContain('web');
  });

  it('keeps the panel closed when a non-service node is clicked', async () => {
    clickNode('net:web');
    await fixture.whenStable();

    expect(panel()).toBeNull();
  });

  it('switches the panel to another service', async () => {
    clickNode('web');
    await fixture.whenStable();
    clickNode('api');
    await fixture.whenStable();

    expect(panel()?.textContent).not.toContain('nginx');
    expect(panel()?.textContent).toContain('node:22-alpine');
  });
});
