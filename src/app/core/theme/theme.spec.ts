import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE, Theme, ThemeStorage } from './theme';

/** Minimal stand-in for matchMedia. jsdom does not implement it. */
class FakeMediaQuery {
  private listener: ((event: MediaQueryListEvent) => void) | null = null;

  constructor(public matches: boolean) {}

  addEventListener(_type: 'change', listener: (event: MediaQueryListEvent) => void): void {
    this.listener = listener;
  }

  removeEventListener(): void {
    this.listener = null;
  }

  /** Simulates the user switching the OS theme. */
  emit(matches: boolean): void {
    this.matches = matches;
    this.listener?.({ matches } as MediaQueryListEvent);
  }
}

/** In-memory storage, independent of what the test runtime provides as localStorage. */
function memoryStorage(): ThemeStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('Theme', () => {
  let systemPrefersLight: FakeMediaQuery;
  let storage: ReturnType<typeof memoryStorage>;

  function setup(storageOverride: ThemeStorage | null = storage): Theme {
    TestBed.configureTestingModule({
      providers: [{ provide: THEME_STORAGE, useValue: storageOverride }],
    });
    const theme = TestBed.inject(Theme);
    TestBed.tick();
    return theme;
  }

  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    storage = memoryStorage();
    systemPrefersLight = new FakeMediaQuery(false);
    vi.stubGlobal('matchMedia', () => systemPrefersLight);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('follows the system preference without setting an attribute', () => {
    systemPrefersLight.matches = true;
    const theme = setup();

    expect(theme.current()).toBe('light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('falls back to dark when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    const theme = setup();

    expect(theme.current()).toBe('dark');
  });

  it('stores a manual choice and mirrors it to the root element', () => {
    const theme = setup();

    theme.toggle();
    TestBed.tick();

    expect(theme.current()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(storage.data.get('stackgraph.theme')).toBe('light');
  });

  it('drops the override when toggling back to the system theme', () => {
    const theme = setup();

    theme.toggle();
    TestBed.tick();
    theme.toggle();
    TestBed.tick();

    expect(theme.current()).toBe('dark');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(storage.data.has('stackgraph.theme')).toBe(false);
  });

  it('restores a stored choice', () => {
    storage.setItem('stackgraph.theme', 'light');
    const theme = setup();

    expect(theme.current()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('ignores an unknown stored value', () => {
    storage.setItem('stackgraph.theme', 'sepia');
    const theme = setup();

    expect(theme.current()).toBe('dark');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('still toggles when storage is unavailable', () => {
    const theme = setup(null);

    theme.toggle();
    TestBed.tick();

    expect(theme.current()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('still toggles when storage throws', () => {
    const throwing: ThemeStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const theme = setup(throwing);

    theme.toggle();
    TestBed.tick();

    expect(theme.current()).toBe('light');
  });

  it('reacts to a system change while no override is set', () => {
    const theme = setup();

    systemPrefersLight.emit(true);

    expect(theme.current()).toBe('light');
  });

  it('keeps a manual choice when the system changes', () => {
    const theme = setup();
    theme.toggle();

    systemPrefersLight.emit(true);

    expect(theme.current()).toBe('light');
  });
});
