import { DOCUMENT } from '@angular/common';
import { DestroyRef, Signal, inject, signal } from '@angular/core';

/**
 * The primary pointer is a finger: an on-screen keyboard is likely, and
 * targets need to be larger. The stylesheets use the same query.
 */
export const touchPointerQuery = '(pointer: coarse)';

/**
 * A CSS media query as a signal: true while it matches. Call it in an
 * injection context; the listener goes away with that context. Where
 * matchMedia is missing (jsdom), the query counts as not matching.
 */
export function mediaQuery(query: string): Signal<boolean> {
  const list = inject(DOCUMENT).defaultView?.matchMedia?.(query);
  const matches = signal(list?.matches ?? false);

  if (list) {
    const onChange = (event: MediaQueryListEvent) => matches.set(event.matches);
    list.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => list.removeEventListener('change', onChange));
  }
  return matches.asReadonly();
}
