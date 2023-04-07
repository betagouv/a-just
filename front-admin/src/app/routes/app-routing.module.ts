import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminAuthGuard } from './admin-auth-guard.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then((mod) => mod.LoginModule),
  },
  {
    path: 'users',
    loadChildren: () =>
      import('./users/users.module').then((mod) => mod.UsersModule),
    canActivate: [AdminAuthGuard],
  },
  {
    path: 'backup-options',
    loadChildren: () =>
      import('./backup-options/backup-options.module').then((mod) => mod.BackupOptionsModule),
    canActivate: [AdminAuthGuard],
  },
  {
    path: 'imports',
    loadChildren: () =>
      import('./imports/imports.module').then((mod) => mod.ImportsModule),
    canActivate: [AdminAuthGuard],
  },
  {
    path: 'news',
    loadChildren: () =>
      import('./news/news.module').then((mod) => mod.NewsModule),
    canActivate: [AdminAuthGuard],
  },
  {
    path: 'juridictions',
    loadChildren: () =>
      import('./juridictions/juridictions.module').then((mod) => mod.JuridictionsModule),
    canActivate: [AdminAuthGuard],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  providers: [AdminAuthGuard],
  exports: [RouterModule],
})
export class AppRoutingModule {}
