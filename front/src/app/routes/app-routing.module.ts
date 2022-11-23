import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AuthGuard } from './auth-guard.service'

const routes: Routes = [
  {
    path: 'login',
    redirectTo: '/connexion',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: '/connexion',
    pathMatch: 'full',
  },
  {
    path: 'connexion',
    loadChildren: () =>
      import('./login/login.module').then((mod) => mod.LoginModule),
  },
  {
    path: 'qui-sommes-nous',
    loadChildren: () =>
      import('./about-us/about-us.module').then((mod) => mod.AboutUsModule),
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
      import('./activities/activities.module').then(
        (mod) => mod.ActivitiesModule
      ),
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
  {
    path: 'signup',
    redirectTo: '/inscription',
    pathMatch: 'full',
  },
  {
    path: 'inscription',
    loadChildren: () =>
      import('./signup/signup.module').then((mod) => mod.SignupModule),
  },
  {
    path: 'mot-de-passe-oublie',
    loadChildren: () =>
      import('./forgot-password/forgot-password.module').then(
        (mod) => mod.ForgotPasswordModule
      ),
  },
  {
    path: 'nouveau-mot-de-passe',
    loadChildren: () =>
      import('./change-password/change-password.module').then(
        (mod) => mod.ChangePasswordModule
      ),
  },
  {
    path: 'simulateur',
    loadChildren: () =>
      import('./simulator/simulator.module').then((mod) => mod.SimulatorModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'reaffectateur',
    loadChildren: () =>
      import('./reaffectator/reaffectator.module').then(
        (mod) => mod.ReaffectatorModule
      ),
    canActivate: [AuthGuard],
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  providers: [AuthGuard],
  exports: [RouterModule],
})
export class AppRoutingModule {}
