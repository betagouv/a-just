import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth-guard.service';

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
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then((mod) => mod.DashboardModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'ventilations',
    loadChildren: () =>
      import('./workforce/workforce.module').then((mod) => mod.WorkforceModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'donnees-d-activite',
    loadChildren: () =>
      import('./activities/activities.module').then((mod) => mod.ActivitiesModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'temps-moyens',
    loadChildren: () =>
      import('./average-etp/average-etp.module').then(
        (mod) => mod.AverageEtpModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'calculateur',
    loadChildren: () =>
      import('./calculator/calculator.module').then(
        (mod) => mod.CalculatorModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'resource-humaine',
    loadChildren: () =>
      import('./human-resource/human-resource.module').then(
        (mod) => mod.HumanResourceModule
      ),
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  providers: [AuthGuard],
  exports: [RouterModule],
})
export class AppRoutingModule {}
