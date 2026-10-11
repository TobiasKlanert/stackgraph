import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StaleNotice } from './stale-notice';

describe('StaleNotice', () => {
  let fixture: ComponentFixture<StaleNotice>;

  function host(): HTMLElement {
    return fixture.nativeElement;
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(StaleNotice);
    await fixture.whenStable();
  });

  it('is a live region even while empty, so a later notice is announced', () => {
    expect(host().getAttribute('role')).toBe('status');
    expect(host().textContent?.trim()).toBe('');
  });

  it('says that the graph is stale', async () => {
    fixture.componentRef.setInput('stale', true);
    await fixture.whenStable();

    expect(host().textContent).toContain('Error in the compose file.');
    expect(host().textContent).toContain('The graph shows the last valid version.');
  });

  it('asks the page to show the error in the editor', async () => {
    fixture.componentRef.setInput('stale', true);
    await fixture.whenStable();
    let asked = 0;
    fixture.componentInstance.showInEditor.subscribe(() => asked++);

    host().querySelector('button')?.click();

    expect(asked).toBe(1);
  });
});
