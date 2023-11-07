import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AuthGuard } from './auth-guard.service'
import { CanDeactivateGuardService } from './canDeactivate-guard-service'
import { ReaffectatorPage } from './reaffectator/reaffectator.page'
import { SimulatorPage } from './simulator/simulator.page'

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
    path: 'bienvenue',
    loadChildren: () =>
      import('./welcome/welcome.module').then((mod) => mod.WelcomeModule),
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
    component: SimulatorPage,
    canActivate: [AuthGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  {
    path: 'reaffectateur',
    component: ReaffectatorPage,
    canActivate: [AuthGuard],
    canDeactivate: [CanDeactivateGuardService],
  },
  {
    path: 'panorama',
    loadChildren: () =>
      import('./panorama/panorama.module').then(
        (mod) => mod.PanoramaModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'carte-juridictions',
    loadChildren: () =>
      import('./juridictions-installed/juridictions-installed.module').then(
        (mod) => mod.JuridictionsInstalledModule
      ),
  },
  {
    path: 'plan-du-site',
    loadChildren: () =>
      import('./sitemap/sitemap.module').then(
        (mod) => mod.SiteMapModule
      ),
  },
  {
    path: 'mentions-legales',
    loadChildren: () =>
      import('./legale-notice/legale-notice.module').then(
        (mod) => mod.LegaleNoticeModule
      ),
  },
  {
    path: 'donnees-personnelles',
    loadChildren: () =>
      import('./privacy/privacy.module').then(
        (mod) => mod.PrivacyModule
      ),
  },
  {
    path: 'declaration-accessibilite',
    loadChildren: () =>
      import('./accessibilities/accessibilities.module').then(
        (mod) => mod.AccessibilitiesModule
      ),
  },
  {
    path: 'contact',
    loadChildren: () =>
      import('./contact/contact.module').then(
        (mod) => mod.ContactModule
      ),
  },
  {
    path: 'stats',
    loadChildren: () =>
      import('./stats/stats.module').then(
        (mod) => mod.StatsModule
      ),
  },
  {
    path: 'logout',
    loadChildren: () =>
      import('./logout/logout.module').then(
        (mod) => mod.LogoutModule
      ),
  },
  {
    path: 'conditions-generales-d-utilisation',
    loadChildren: () =>
      import('./cgu/cgu.module').then(
        (mod) => mod.CGUModule
      ),
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'}),
  ],
  providers: [AuthGuard, CanDeactivateGuardService],
  exports: [RouterModule],
})

export class AppRoutingModule {}
