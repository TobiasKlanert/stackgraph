import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { Theme } from './core/theme/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        // Fragment links (table of contents on the About page) scroll to
        // their target instead of being ignored by the router.
        anchorScrolling: 'enabled',
        // A new page opens at the top, the back button restores the
        // previous position. Without it, a link in the footer of a long
        // page opens the next page scrolled down.
        scrollPositionRestoration: 'enabled',
      })
    ),
    // Instantiates the theme before the first render, so a stored choice
    // applies on every route, not only once something injects the service.
    provideAppInitializer(() => {
      inject(Theme);
    }),
  ],
};
