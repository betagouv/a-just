import { Routes } from '@angular/router';
import {
  activitiesGuard,
  allSimulatorGuard,
  authGuard,
  cockpitGuard,
  dashboardGuard,
  reaffectatorGuard,
  tempsMoyensGuard,
  ventilationsGuard,
  whiteSimulatorGuard,
} from './auth.guard';
import { typeGuard } from './type.guard';
import { closeGuard } from './close.guard';
import { SimulatorPage } from './simulator/simulator.page';
import { AverageEtpDisplayerPage } from './average-etp/average-etp-displayer/average-etp-displayer.page';
import { ReaffectatorPage } from './reaffectator/reaffectator.page';
import { WhiteSimulatorPage } from './simulator/white-simulator/white-simulator.page';

export const routes: Routes = [
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
    loadComponent: () =>
      import('./login/login.page').then((mod) => mod.LoginPage),
  },
  {
    path: 'qui-sommes-nous',
    loadComponent: () =>
      import('./about-us/about-us.page').then((mod) => mod.AboutUsPage),
  },
  {
    path: 'bienvenue',
    loadComponent: () =>
      import('./welcome/welcome.page').then((mod) => mod.WelcomePage),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.page').then((mod) => mod.DashboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'ventilations',
    loadComponent: () =>
      import('./workforce/workforce.page').then((mod) => mod.WorkforcePage),
    canActivate: [ventilationsGuard, typeGuard],
  },
  {
    path: 'donnees-d-activite',
    loadComponent: () =>
      import('./activities/activities.page').then((mod) => mod.ActivitiesPage),
    canActivate: [activitiesGuard, typeGuard],
  },
  {
    path: 'temps-moyens',
    loadComponent: () =>
      import('./average-etp/average-etp.page').then(
        (mod) => mod.AverageEtpPage
      ),
    canActivate: [tempsMoyensGuard, typeGuard],
  },
  {
    path: 'cockpit',
    loadComponent: () =>
      import('./calculator/calculator.page').then((mod) => mod.CalculatorPage),
    canActivate: [cockpitGuard, typeGuard],
  },
  {
    path: 'resource-humaine/:id',
    loadComponent: () =>
      import('./human-resource/human-resource.page').then(
        (mod) => mod.HumanResourcePage
      ),
    canActivate: [ventilationsGuard, typeGuard],
  },
  {
    path: 'signup',
    redirectTo: '/inscription',
    pathMatch: 'full',
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./signup/signup.page').then((mod) => mod.SignupPage),
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () =>
      import('./forgot-password/forgot-password.page').then(
        (mod) => mod.ForgotPassword
      ),
  },
  {
    path: 'nouveau-mot-de-passe',
    loadComponent: () =>
      import('./change-password/change-password.page').then(
        (mod) => mod.ChangePassword
      ),
  },
  {
    path: 'referentiel-de-temps/:id',
    component: AverageEtpDisplayerPage,
    canActivate: [tempsMoyensGuard, typeGuard],
    canDeactivate: [closeGuard],
  },
  {
    path: 'simulateur',
    component: SimulatorPage,
    canActivate: [allSimulatorGuard, typeGuard],
    canDeactivate: [closeGuard],
  },
  {
    path: 'simulateur-sans-donnees',
    component: WhiteSimulatorPage,
    canActivate: [whiteSimulatorGuard, typeGuard],
    canDeactivate: [closeGuard],
  },
  {
    path: 'reaffectateur',
    component: ReaffectatorPage,
    canActivate: [reaffectatorGuard, typeGuard],
    canDeactivate: [closeGuard],
  },
  {
    path: 'panorama',
    loadComponent: () =>
      import('./panorama/panorama.page').then((mod) => mod.PanoramaPage),
    canActivate: [dashboardGuard, typeGuard],
  },
  {
    path: 'carte-juridictions',
    loadComponent: () =>
      import('./juridictions-installed/juridictions-installed.page').then(
        (mod) => mod.JuridictionsInstalledPage
      ),
  },
  {
    path: 'plan-du-site',
    loadComponent: () =>
      import('./sitemap/sitemap.page').then((mod) => mod.SiteMapPage),
  },
  {
    path: 'mentions-legales',
    loadComponent: () =>
      import('./legale-notice/legale-notice.page').then(
        (mod) => mod.LegaleNoticePage
      ),
  },
  {
    path: 'donnees-personnelles',
    loadComponent: () =>
      import('./privacy/privacy.page').then((mod) => mod.PrivacyPage),
  },
  {
    path: 'declaration-accessibilite',
    loadComponent: () =>
      import('./accessibilities/accessibilities.page').then(
        (mod) => mod.AccessibilitiesPage
      ),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./contact/contact.page').then((mod) => mod.ContactPage),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./stats/stats.page').then((mod) => mod.StatsPage),
  },
  {
    path: 'logout',
    loadComponent: () =>
      import('./logout/logout.page').then((mod) => mod.LogoutPage),
  },
  {
    path: 'conditions-generales-d-utilisation',
    loadComponent: () => import('./cgu/cgu.page').then((mod) => mod.CGUPage),
  },
  {
    path: 'centre-d-aide',
    loadComponent: () =>
      import('./help-center/help-center.page').then(
        (mod) => mod.HelpCenterPage
      ),
    canActivate: [authGuard, typeGuard],
  },
  {
    path: '**',
    redirectTo: '/connexion',
    pathMatch: 'full',
  },
];
