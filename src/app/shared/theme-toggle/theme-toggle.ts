import { Component, computed, inject } from '@angular/core';
import { Theme } from '../../core/theme/theme';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  protected readonly theme = inject(Theme);

  /** Names the action, not the state: the button switches *to* the other theme. */
  protected readonly label = computed(() =>
    this.theme.current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  );
}
