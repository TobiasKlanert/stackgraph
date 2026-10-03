import { TestBed } from '@angular/core/testing';
import { ZoomControls } from './zoom-controls';

describe('ZoomControls', () => {
  function render(inputs: { percent?: number | null; canZoomIn?: boolean; canZoomOut?: boolean }) {
    const fixture = TestBed.createComponent(ZoomControls);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const button = (selector: string) => el.querySelector<HTMLButtonElement>(selector);
    return { fixture, el, button };
  }

  it('groups the buttons under a name', () => {
    const { el } = render({});

    expect(el.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Zoom');
  });

  it('shows the real size and names the reset after it', () => {
    const { button } = render({ percent: 80 });

    expect(button('.percent')?.textContent?.trim()).toBe('80%');
    expect(button('.percent')?.getAttribute('aria-label')).toBe('80%, reset zoom to 100%');
  });

  it('shows a dash until the canvas has been measured', () => {
    const { button } = render({ percent: null });

    expect(button('.percent')?.textContent?.trim()).toBe('–');
  });

  it('reports each button as its own event', () => {
    const { fixture, button } = render({});
    const events: string[] = [];
    const instance = fixture.componentInstance;
    instance.zoomOut.subscribe(() => events.push('out'));
    instance.actualSize.subscribe(() => events.push('actual'));
    instance.zoomIn.subscribe(() => events.push('in'));
    instance.fit.subscribe(() => events.push('fit'));

    button('[aria-label="Zoom out"]')?.click();
    button('.percent')?.click();
    button('[aria-label="Zoom in"]')?.click();
    button('.fit')?.click();

    expect(events).toEqual(['out', 'actual', 'in', 'fit']);
  });

  it('disables zooming further at the limits', () => {
    const { button } = render({ canZoomIn: false, canZoomOut: true });

    expect(button('[aria-label="Zoom in"]')?.disabled).toBe(true);
    expect(button('[aria-label="Zoom out"]')?.disabled).toBe(false);
  });
});
