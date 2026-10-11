import { Component, ElementRef, input, model, viewChildren } from '@angular/core';
import { type Pane, paneTabs } from '../compact-layout';

/** Index of the tab a key moves to (WAI-ARIA tabs pattern), or null for other keys. */
function tabIndexForKey(key: string, current: number, length: number): number | null {
  switch (key) {
    case 'ArrowLeft':
      return (current - 1 + length) % length;
    case 'ArrowRight':
      return (current + 1) % length;
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return null;
  }
}

/**
 * The Editor | Graph switch of the compact layout (mobile mockup): a real
 * tab list, where arrow keys, Home and End move and select. The tab panels
 * belong to the page; their ids are the pane names.
 */
@Component({
  selector: 'app-pane-tabs',
  templateUrl: './pane-tabs.html',
  styleUrl: './pane-tabs.scss',
})
export class PaneTabs {
  /** The pane shown. Two-way, so the page can switch as well (skip link, error notice). */
  readonly selected = model.required<Pane>();

  /** A pane whose tab shows that something is wrong there, e.g. the editor while the YAML has an error. */
  readonly errorIn = input<Pane | null>(null);

  protected readonly tabs = paneTabs;
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  /** Puts keyboard focus on the selected tab, e.g. after the page switched panes for the user. */
  focusSelected(): void {
    const index = paneTabs.findIndex((tab) => tab.pane === this.selected());
    this.buttons()[index]?.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const current = paneTabs.findIndex((tab) => tab.pane === this.selected());
    const target = tabIndexForKey(event.key, current, paneTabs.length);
    if (target === null) {
      return;
    }
    const tab = paneTabs[target];
    if (tab === undefined) {
      return;
    }
    event.preventDefault();
    this.selected.set(tab.pane);
    this.buttons()[target]?.nativeElement.focus();
  }
}
