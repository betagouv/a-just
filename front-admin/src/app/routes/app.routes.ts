import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'tests-autom',
    loadComponent: () =>
      import('./tests-autom/tests-autom.page').then((mod) => mod.TestsAutomPage),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.page').then((mod) => mod.LoginPage),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users.page').then((mod) => mod.UsersPage),
    canActivate: [authGuard],
  },
  {
    path: 'backup-options',
    loadComponent: () =>
      import('./backup-options/backup-options.page').then(
        (mod) => mod.BackupOptionsPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'referentiel',
    loadComponent: () =>
      import('./referentiel/referentiel.page').then(
        (mod) => mod.ReferentielPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'imports',
    loadComponent: () =>
      import('./imports/imports.page').then((mod) => mod.ImportsPage),
    canActivate: [authGuard],
  },
  {
    path: 'news',
    loadComponent: () => import('./news/news.page').then((mod) => mod.NewsPage),
    canActivate: [authGuard],
  },
  {
    path: 'juridictions',
    loadComponent: () =>
      import('./juridictions/juridictions.page').then(
        (mod) => mod.JuridictionsPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'yaml-tools',
    loadComponent: () =>
      import('./yaml-tools/yaml-tools.page').then((mod) => mod.YamlToolsPage),
    canActivate: [authGuard],
  },
  {
    path: 'data',
    loadComponent: () => import('./data/data.page').then((mod) => mod.DataPage),
    canActivate: [authGuard],
  },
];
