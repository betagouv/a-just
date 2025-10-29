import { Routes } from '@angular/router'
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
} from './auth.guard'
import { typeGuard } from './type.guard'
import { closeGuard } from './close.guard'
import { SimulatorPage } from './simulator/simulator.page'
import { AverageEtpDisplayerPage } from './average-etp/average-etp-displayer/average-etp-displayer.page'
import { ReaffectatorPage } from './reaffectator/reaffectator.page'
import { WhiteSimulatorPage } from './simulator/white-simulator/white-simulator.page'
import { LoginPage } from './login/login.page'
import { AboutUsPage } from './about-us/about-us.page'
import { WelcomePage } from './welcome/welcome.page'
import { DashboardPage } from './dashboard/dashboard.page'
import { WorkforcePage } from './workforce/workforce.page'
import { ActivitiesPage } from './activities/activities.page'
import { AverageEtpPage } from './average-etp/average-etp.page'
import { CalculatorPage } from './calculator/calculator.page'
import { HumanResourcePage } from './human-resource/human-resource.page'
import { SignupPage } from './signup/signup.page'
import { ForgotPassword } from './forgot-password/forgot-password.page'
import { ChangePassword } from './change-password/change-password.page'
import { PanoramaPage } from './panorama/panorama.page'
import { JuridictionsInstalledPage } from './juridictions-installed/juridictions-installed.page'
import { SiteMapPage } from './sitemap/sitemap.page'
import { LegaleNoticePage } from './legale-notice/legale-notice.page'
import { PrivacyPage } from './privacy/privacy.page'
import { AccessibilitiesPage } from './accessibilities/accessibilities.page'
import { ContactPage } from './contact/contact.page'
import { StatsPage } from './stats/stats.page'
import { LogoutPage } from './logout/logout.page'
import { CGUPage } from './cgu/cgu.page'
import { HelpCenterPage } from './help-center/help-center.page'

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
    component: LoginPage,
  },
  {
    path: 'qui-sommes-nous',
    component: AboutUsPage,
  },
  {
    path: 'bienvenue',
    component: WelcomePage,
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    canActivate: [authGuard],
  },
  {
    path: 'ventilations',
    component: WorkforcePage,
    canActivate: [ventilationsGuard, typeGuard],
  },
  {
    path: 'donnees-d-activite',
    component: ActivitiesPage,
    canActivate: [activitiesGuard, typeGuard],
  },
  {
    path: 'temps-moyens',
    component: AverageEtpPage,
    canActivate: [tempsMoyensGuard, typeGuard],
  },
  {
    path: 'cockpit',
    component: CalculatorPage,
    canActivate: [cockpitGuard, typeGuard],
  },
  {
    path: 'resource-humaine/:id',
    component: HumanResourcePage,
    canActivate: [ventilationsGuard, typeGuard],
  },
  {
    path: 'signup',
    redirectTo: '/inscription',
    pathMatch: 'full',
  },
  {
    path: 'inscription',
    component: SignupPage,
  },
  {
    path: 'mot-de-passe-oublie',
    component: ForgotPassword,
  },
  {
    path: 'nouveau-mot-de-passe',
    component: ChangePassword,
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
    component: PanoramaPage,
    canActivate: [dashboardGuard, typeGuard],
  },
  {
    path: 'carte-juridictions',
    component: JuridictionsInstalledPage,
  },
  {
    path: 'plan-du-site',
    component: SiteMapPage,
  },
  {
    path: 'mentions-legales',
    component: LegaleNoticePage,
  },
  {
    path: 'donnees-personnelles',
    component: PrivacyPage,
  },
  {
    path: 'declaration-accessibilite',
    component: AccessibilitiesPage,
  },
  {
    path: 'contact',
    component: ContactPage,
  },
  {
    path: 'stats',
    component: StatsPage,
  },
  {
    path: 'logout',
    component: LogoutPage,
  },
  {
    path: 'conditions-generales-d-utilisation',
    component: CGUPage,
  },
  {
    path: 'centre-d-aide',
    component: HelpCenterPage,
    canActivate: [authGuard, typeGuard],
  },
  {
    path: '**',
    redirectTo: '/connexion',
    pathMatch: 'full',
  },
]
