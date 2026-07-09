import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailPanel } from './detail-panel';

describe('DetailPanel', () => {
  let component: DetailPanel;
  let fixture: ComponentFixture<DetailPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
