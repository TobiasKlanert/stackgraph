import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rendering } from './rendering';

describe('Rendering', () => {
  let component: Rendering;
  let fixture: ComponentFixture<Rendering>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rendering],
    }).compileComponents();

    fixture = TestBed.createComponent(Rendering);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
