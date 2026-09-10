import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Zoomable } from './zoomable';

@Component({
  imports: [Zoomable],
  template: `<svg appZoomable><g [attr.transform]="zoomable().transform()"></g></svg>`,
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
});
