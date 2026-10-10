import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DecisionCard } from './decision-card';

@Component({
  imports: [DecisionCard],
  template: `
    <app-decision-card
      [index]="1"
      heading="ELK and my own SVG"
      [followsFrom]="['c-direction', 'c-a11y']"
    >
      <p><strong>Decision.</strong> ELK plus my own SVG.</p>
    </app-decision-card>
  `,
})
class Host {}

describe('DecisionCard', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'about', component: Host }])],
    });
    const harness = await RouterTestingHarness.create('/about');
    el = harness.routeNativeElement as HTMLElement;
  });

  it('shows number and title as a level-3 heading', () => {
    expect(el.querySelector('h3')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1. ELK and my own SVG'
    );
  });

  it('links each constraint it follows from, by title, to its row on the page', () => {
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.follows a'));

    expect(links.map((a) => a.textContent?.trim())).toEqual([
      'A layout that shows direction',
      'Accessibility is part of v1',
    ]);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/about#c-direction',
      '/about#c-a11y',
    ]);
  });

  it('shows the projected body', () => {
    expect(el.querySelector('.body p')?.textContent).toBe('Decision. ELK plus my own SVG.');
  });
});
