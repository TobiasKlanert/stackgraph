import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE } from '../../core/theme/theme';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    // Dark system theme; jsdom has no matchMedia of its own.
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    // Persistence is covered in the Theme spec; here it only has to stay out of the way.
    TestBed.configureTestingModule({
      providers: [{ provide: THEME_STORAGE, useValue: null }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function render(): HTMLButtonElement {
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('button');
  }

  it('names the action it will perform', () => {
    expect(render().getAttribute('aria-label')).toBe('Switch to light theme');
  });

  it('switches the theme and updates its label on click', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    button.click();
    await fixture.whenStable();

    expect(button.getAttribute('aria-label')).toBe('Switch to dark theme');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
