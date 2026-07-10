import { Routes } from '@angular/router';
import { Home } from './features/graph/home/home';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: '/imprint',
    loadComponent: () => import('./pages/imprint/imprint').then((m) => m.Imprint),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },
];
