import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphPage } from './graph-page';

describe('GraphPage', () => {
  let component: GraphPage;
  let fixture: ComponentFixture<GraphPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphPage],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
