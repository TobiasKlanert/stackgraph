import { Routes } from '@angular/router';
import { Home } from './features/graph/home/home';
import { Imprint } from './pages/imprint/imprint';
import { PrivacyPolicy } from './pages/privacy-policy/privacy-policy';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'impressum', component: Imprint },
  { path: 'datenschutz', component: PrivacyPolicy },
];
