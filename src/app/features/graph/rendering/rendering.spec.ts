import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rendering } from './rendering';
import { PositionedGraph } from '../../../core/models/layout.model';

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
});
