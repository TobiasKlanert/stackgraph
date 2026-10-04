import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Zoomable, displayPercent, fitScale } from './zoomable';

@Component({
  imports: [Zoomable],
  template: `<svg appZoomable [contentSize]="{ width: 400, height: 300 }">
    <g [attr.transform]="zoomable().transform()"></g>
  </svg>`,
})
class TestHost {
  readonly zoomable = viewChild.required(Zoomable);
}

describe('Zoomable', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create an instance', () => {
    expect(fixture.componentInstance.zoomable()).toBeTruthy();
  });

  it('starts with the identity transform', () => {
    expect(fixture.componentInstance.zoomable().transform()).toBe('translate(0,0) scale(1)');
  });

  it('zooms in and out within the scale extent', async () => {
    const zoomable = fixture.componentInstance.zoomable();

    zoomable.zoomBy(2);
    await fixture.whenStable();
    expect(zoomable.transform()).toContain('scale(2)');

    zoomable.zoomBy(100);
    await fixture.whenStable();
    expect(zoomable.transform()).toContain('scale(4)');
    expect(zoomable.canZoomIn()).toBe(false);
    expect(zoomable.canZoomOut()).toBe(true);
  });

  it('fits back to the identity transform', async () => {
    const zoomable = fixture.componentInstance.zoomable();

    zoomable.zoomBy(2);
    zoomable.fitToView();
    await fixture.whenStable();

    expect(zoomable.transform()).toBe('translate(0,0) scale(1)');
  });
});

describe('fitScale', () => {
  it('uses the tighter of both axes, as the browser does for the viewBox', () => {
    expect(fitScale({ width: 800, height: 600 }, { width: 400, height: 400 })).toBe(1.5);
  });

  it('is unknown before the element has a size', () => {
    expect(fitScale({ width: 0, height: 0 }, { width: 400, height: 400 })).toBeNull();
  });
});

describe('displayPercent', () => {
  it('combines fit and zoom into the real size', () => {
    expect(displayPercent(0.8, 1)).toBe(80);
    expect(displayPercent(0.8, 1.25)).toBe(100);
  });

  it('stays unknown without a fit', () => {
    expect(displayPercent(null, 2)).toBeNull();
  });
});
