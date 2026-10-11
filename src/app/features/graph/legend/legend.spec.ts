import { TestBed } from '@angular/core/testing';
import { Legend, type LegendPlacement } from './legend';

describe('Legend', () => {
  function render(placement?: LegendPlacement): HTMLElement {
    const fixture = TestBed.createComponent(Legend);
    if (placement !== undefined) {
      fixture.componentRef.setInput('placement', placement);
    }
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('is a group labelled for assistive technology', () => {
    const group = render().querySelector('[role="group"]');
    const title = group?.querySelector(`#${group.getAttribute('aria-labelledby')}`);

    expect(title?.textContent).toBe('Legend');
    expect(title?.classList.contains('sr-only')).toBe(true);
  });

  it('shows its title in a panel, still labelling the group', () => {
    const group = render('panel').querySelector('[role="group"]');
    const title = group?.querySelector(`#${group.getAttribute('aria-labelledby')}`);

    expect(title?.textContent).toBe('Legend');
    expect(title?.classList.contains('sr-only')).toBe(false);
  });

  it('explains every edge style and the port chips', () => {
    const entries = Array.from(render().querySelectorAll('li')).map((li) => li.textContent?.trim());

    expect(entries).toEqual(['Depends on', 'Networks', 'Volumes', 'Ports']);
  });

  it('hides the drawn samples from assistive technology', () => {
    const samples = Array.from(render().querySelectorAll('.sample'));

    expect(samples).toHaveLength(4);
    expect(samples.every((s) => s.getAttribute('aria-hidden') === 'true')).toBe(true);
  });
});
