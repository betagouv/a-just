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
    path: 'effectifs',
    loadChildren: () =>
      import('./workforce/workforce.module').then((mod) => mod.WorkforceModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'simulateurs',
    loadChildren: () =>
      import('./simulators/simulators.module').then((mod) => mod.SimulatorsModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'indicateurs',
    loadChildren: () =>
      import('./indicators/indicators.module').then(
        (mod) => mod.IndicatorsModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'rapports',
    loadChildren: () =>
      import('./reports/reports.module').then((mod) => mod.ReportsModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'parametres',
    loadChildren: () =>
      import('./parameters/parameters.module').then(
        (mod) => mod.ParametersModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'aides',
    loadChildren: () =>
      import('./helps/helps.module').then((mod) => mod.HelpsModule),
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  providers: [AuthGuard],
  exports: [RouterModule],
})
export class AppRoutingModule {}
