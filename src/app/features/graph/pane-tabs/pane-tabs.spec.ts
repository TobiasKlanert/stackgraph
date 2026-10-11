import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { type Pane } from '../compact-layout';
import { PaneTabs } from './pane-tabs';

/** Binds `selected` two-way, as the graph page does. */
@Component({
  imports: [PaneTabs],
  template: `<app-pane-tabs [(selected)]="selected" [errorIn]="errorIn()" />`,
})
class Host {
  readonly selected = signal<Pane>('graph');
  readonly errorIn = signal<Pane | null>(null);
  readonly tabs = viewChild.required(PaneTabs);
}

describe('PaneTabs', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  function tab(pane: Pane): HTMLButtonElement {
    const el = fixture.nativeElement.querySelector(`[role="tab"][aria-controls="${pane}"]`);
    if (el === null) {
      throw new Error(`no tab for ${pane}`);
    }
    return el;
  }

  async function press(target: HTMLElement, key: string): Promise<KeyboardEvent> {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    await fixture.whenStable();
    return event;
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('is a labelled tab list with one tab per pane, in order', () => {
    const list = fixture.nativeElement.querySelector('[role="tablist"]');

    expect(list?.getAttribute('aria-label')).toBe('View');
    expect(Array.from<Element>(list.querySelectorAll('[role="tab"]')).map((t) => t.id)).toEqual([
      'pane-tab-editor',
      'pane-tab-graph',
    ]);
  });

  it('marks the selected tab and keeps only it in the tab order', () => {
    expect(tab('graph').getAttribute('aria-selected')).toBe('true');
    expect(tab('graph').tabIndex).toBe(0);
    expect(tab('editor').getAttribute('aria-selected')).toBe('false');
    expect(tab('editor').tabIndex).toBe(-1);
  });

  it('selects a tab on click and reports it to the page', async () => {
    tab('editor').click();
    await fixture.whenStable();

    expect(host.selected()).toBe('editor');
    expect(tab('editor').getAttribute('aria-selected')).toBe('true');
  });

  it('moves and selects with the arrow keys, wrapping at the ends', async () => {
    tab('graph').focus();

    await press(tab('graph'), 'ArrowLeft');
    expect(host.selected()).toBe('editor');
    expect(document.activeElement).toBe(tab('editor'));

    await press(tab('editor'), 'ArrowLeft');
    expect(host.selected()).toBe('graph');
    expect(document.activeElement).toBe(tab('graph'));

    await press(tab('graph'), 'ArrowRight');
    expect(host.selected()).toBe('editor');
  });

  it('jumps to the first and last tab with Home and End', async () => {
    await press(tab('graph'), 'Home');
    expect(document.activeElement).toBe(tab('editor'));

    await press(tab('editor'), 'End');
    expect(document.activeElement).toBe(tab('graph'));
  });

  it('leaves other keys to the browser', async () => {
    const event = await press(tab('graph'), 'Enter');

    expect(event.defaultPrevented).toBe(false);
    expect(host.selected()).toBe('graph');
  });

  it('marks the tab of a pane with errors, also for screen readers', async () => {
    expect(tab('editor').querySelector('.error-dot')).toBeNull();

    host.errorIn.set('editor');
    await fixture.whenStable();

    expect(tab('editor').querySelector('.error-dot')).not.toBeNull();
    expect(tab('editor').textContent?.replace(/\s+/g, ' ').trim()).toBe('Editor has errors');
    expect(tab('graph').querySelector('.error-dot')).toBeNull();
  });

  it('focuses the selected tab on request', async () => {
    host.selected.set('editor');
    await fixture.whenStable();

    host.tabs().focusSelected();

    expect(document.activeElement).toBe(tab('editor'));
  });
});
