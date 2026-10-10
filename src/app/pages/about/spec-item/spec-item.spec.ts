import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SpecItem } from './spec-item';

@Component({
  imports: [SpecItem],
  template: `
    <app-spec-item id="plain" heading="Feedback while typing">
      The graph follows the <code>editor</code>.
    </app-spec-item>
    <app-spec-item id="tagged" heading="The graph itself is operable" tag="WCAG 2.1.1">
      Text
    </app-spec-item>
  `,
})
class Host {}

describe('SpecItem', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('shows the heading as a level-3 heading', () => {
    expect(el.querySelector('#plain h3')?.textContent).toBe('Feedback while typing');
  });

  it('puts the projected text, inline code included, into one paragraph', () => {
    const text = el.querySelector('#plain p.text');

    expect(text?.textContent?.trim()).toBe('The graph follows the editor.');
    expect(text?.querySelector('code')?.textContent).toBe('editor');
  });

  it('shows the tag only when there is one', () => {
    expect(el.querySelector('#plain .tag')).toBeNull();
    expect(el.querySelector('#tagged .tag')?.textContent).toBe('WCAG 2.1.1');
  });
});
