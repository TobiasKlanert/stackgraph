import { Routes } from '@angular/router';
import { GraphPage } from './features/graph/graph-page/graph-page';

export const routes: Routes = [
  { path: '', component: GraphPage },
  {
    path: 'imprint',
    loadComponent: () => import('./pages/imprint/imprint').then((m) => m.Imprint),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },
];
