import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { Theme } from './core/theme/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Instantiates the theme before the first render, so a stored choice
    // applies on every route, not only once something injects the service.
    provideAppInitializer(() => {
      inject(Theme);
    }),
  ],
};
