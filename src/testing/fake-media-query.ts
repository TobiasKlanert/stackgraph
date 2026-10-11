/**
 * Minimal stand-in for the MediaQueryList that matchMedia returns. jsdom
 * does not implement matchMedia, so specs stub it with this.
 */
export class FakeMediaQuery {
  private listener: ((event: MediaQueryListEvent) => void) | null = null;

  constructor(public matches: boolean) {}

  addEventListener(_type: 'change', listener: (event: MediaQueryListEvent) => void): void {
    this.listener = listener;
  }

  removeEventListener(): void {
    this.listener = null;
  }

  /** Whether someone still listens, to check that listeners are cleaned up. */
  get hasListener(): boolean {
    return this.listener !== null;
  }

  /** Simulates the browser reporting a change, e.g. a resized window or a new OS theme. */
  emit(matches: boolean): void {
    this.matches = matches;
    this.listener?.({ matches } as MediaQueryListEvent);
  }
}
