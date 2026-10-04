import {
  DestroyRef,
  Injectable,
  InjectionToken,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeName = 'light' | 'dark';

const storageKey = 'stackgraph.theme';
// Asks for light, not dark: a browser without a preference then counts as
// dark, the same fallback the stylesheet uses.
const lightQuery = '(prefers-color-scheme: light)';

/** The slice of the Web Storage API the theme needs. Narrow on purpose, so fakes stay trivial. */
export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Where the manual choice is persisted. A token instead of the global
 * localStorage, so tests hand in their own storage instead of depending on
 * whatever the runtime provides. Node 25+ ships its own localStorage global,
 * which is undefined unless --localstorage-file is set and shadows jsdom's.
 */
export const THEME_STORAGE = new InjectionToken<ThemeStorage | null>('THEME_STORAGE', {
  providedIn: 'root',
  factory: () => {
    try {
      return inject(DOCUMENT).defaultView?.localStorage ?? null;
    } catch {
      // Merely reading window.localStorage throws when storage is blocked.
      return null;
    }
  },
});

function isThemeName(value: unknown): value is ThemeName {
  return value === 'light' || value === 'dark';
}

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly storage = inject(THEME_STORAGE);

  /** Live system preference. Dark when the browser reports none, matching the CSS fallback. */
  private readonly systemTheme = signal<ThemeName>(this.readSystemTheme());

  /** Manual choice. null means: follow the system. */
  private readonly override = signal<ThemeName | null>(this.readStoredOverride());

  /** The theme actually shown. The toggle reads this for its icon and label. */
  readonly current = computed(() => this.override() ?? this.systemTheme());

  constructor() {
    this.watchSystemTheme();

    // Mirrors the override into the DOM and storage. Without an override the
    // attribute is removed, so the CSS media query decides on its own.
    effect(() => {
      const override = this.override();
      const root = this.document.documentElement;

      if (override === null) {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', override);
      }
      this.writeStoredOverride(override);
    });
  }

  toggle(): void {
    const next: ThemeName = this.current() === 'dark' ? 'light' : 'dark';
    // Toggling back to what the system shows anyway drops the override,
    // so the app follows the system again instead of pinning a theme forever.
    this.override.set(next === this.systemTheme() ? null : next);
  }

  private watchSystemTheme(): void {
    const query = this.window?.matchMedia?.(lightQuery);
    if (!query) {
      return;
    }
    const onChange = (event: MediaQueryListEvent) =>
      this.systemTheme.set(event.matches ? 'light' : 'dark');

    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
  }

  private readSystemTheme(): ThemeName {
    const query = this.window?.matchMedia?.(lightQuery);
    return query?.matches ? 'light' : 'dark';
  }

  // Storage calls can still throw (quota, some private modes). The theme is
  // a convenience, so failures are swallowed.
  private readStoredOverride(): ThemeName | null {
    try {
      const stored = this.storage?.getItem(storageKey);
      return isThemeName(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  private writeStoredOverride(value: ThemeName | null): void {
    try {
      if (value === null) {
        this.storage?.removeItem(storageKey);
      } else {
        this.storage?.setItem(storageKey, value);
      }
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
  }
}
