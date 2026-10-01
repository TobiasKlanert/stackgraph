import { Routes } from '@angular/router';
import { GraphPage } from './features/graph/graph-page/graph-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: GraphPage, title: 'StackGraph' },
  {
    // Shared frame for the text pages; lazy like the pages themselves.
    path: '',
    loadComponent: () =>
      import('./pages/document-layout/document-layout').then((m) => m.DocumentLayout),
    children: [
      {
        path: 'about',
        title: 'About · StackGraph',
        loadComponent: () => import('./pages/about/about').then((m) => m.About),
      },
      {
        path: 'imprint',
        title: 'Impressum · StackGraph',
        loadComponent: () => import('./pages/imprint/imprint').then((m) => m.Imprint),
      },
      {
        path: 'privacy-policy',
        title: 'Datenschutz · StackGraph',
        loadComponent: () =>
          import('./pages/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
      },
    ],
  },
  // nginx answers every path with index.html, so unknown paths land here.
  { path: '**', redirectTo: '' },
];
