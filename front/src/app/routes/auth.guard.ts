import { inject, Injectable } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from '../services/auth/auth.service'
import {
  USER_ACCESS_ACTIVITIES,
  USER_ACCESS_AVERAGE_TIME,
  USER_ACCESS_CALCULATOR,
  USER_ACCESS_DASHBOARD,
  USER_ACCESS_REAFFECTATOR,
  USER_ACCESS_SIMULATOR,
  USER_ACCESS_VENTILATIONS,
  USER_ACCESS_WHITE_SIMULATOR,
} from '../constants/user-access'

/**
 * Service de gestion des permissions globales
 */
@Injectable({
  providedIn: 'root',
})
class PermissionsService {
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)
  /**
   * Service de gestion des routes
   */
  router = inject(Router)

  /**
   * Vérifie si l'utilisateur est connecté
   * @returns
   */
  async checkLogin() {
    if (await this.authService.userConnected()) {
      return true
    }

    this.authService.redirectUrl = window.location.pathname + window.location.search + window.location.hash

    console.log('redirectUrl', this.authService.redirectUrl, window.location.pathname + window.location.search + window.location.hash)
    // Navigate to the login page with extras
    this.router.navigate(['/login'])
    return false
  }
}

/**
 * Guard de l'authentification
 * @param route
 * @param state
 * @returns
 */
export const authGuard: CanActivateFn = (route, state) => {
  return inject(PermissionsService).checkLogin()
}

/**
 * Guard de la page des temps moyens
 * @param route
 * @param state
 * @returns
 */
@Injectable({
  providedIn: 'root',
})
class TempsMoyensPermissionsService {
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)

  /**
   * Vérifie si l'utilisateur peut voir la page des temps moyens
   * @returns
   */
  async canViewTempsMoyens() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_AVERAGE_TIME) !== -1 ? true : false
  }
}

/**
 * Guard de la page des temps moyens
 * @param route
 * @param state
 * @returns
 */
export const tempsMoyensGuard: CanActivateFn = (route, state) => {
  return inject(TempsMoyensPermissionsService).canViewTempsMoyens()
}

/**
 * Service de gestion des permissions de la page des reaffectations
 */
@Injectable({
  providedIn: 'root',
})
class ReaffectatorPermissionsService {
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)

  /**
   * Vérifie si l'utilisateur peut voir la page des reaffectations
   * @returns
   */
  async canViewReaffectator() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_REAFFECTATOR) !== -1 ? true : false
  }
}

/**
 * Guard de la page des reaffectations
 * @param route
 * @param state
 * @returns
 */
export const reaffectatorGuard: CanActivateFn = (route, state) => {
  return inject(ReaffectatorPermissionsService).canViewReaffectator()
}

/**
 * Service de gestion des permissions de la page du cockpit
 */
@Injectable({
  providedIn: 'root',
})
class CockpitPermissionsService {
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)

  /**
   * Vérifie si l'utilisateur peut voir la page du cockpit
   * @returns
   */
  async canViewCockpit() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_CALCULATOR) !== -1 ? true : false
  }
}

/**
 * Guard de la page du cockpit
 * @param route
 * @param state
 * @returns
 */
export const cockpitGuard: CanActivateFn = (route, state) => {
  return inject(CockpitPermissionsService).canViewCockpit()
}

/**
 * Service de gestion des permissions de la page du simulateur
 */
@Injectable({
  providedIn: 'root',
})
class SimulatorPermissionsService {
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)

  /**
   * Vérifie si l'utilisateur peut voir la page du simulateur
   * @returns
   */
  async canViewSimulator() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_SIMULATOR) !== -1 ? true : false
  }
}

/**
 * Guard de la page du simulateur
 * @param route
 * @param state
 * @returns
 */
export const simulatorGuard: CanActivateFn = (route, state) => {
  return inject(SimulatorPermissionsService).canViewSimulator()
}

/**
 * Service de gestion des permissions de la page du simulateur blanc
 */
@Injectable({
  providedIn: 'root',
})
class WhiteSimulatorPermissionsService {
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)

  /**
   * Vérifie si l'utilisateur peut voir la page du simulateur blanc
   * @returns
   */
  async canViewWhiteSimulator() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR) !== -1 ? true : false
  }
}

/**
 * Guard de la page du simulateur blanc
 * @param route
 * @param state
 * @returns
 */
export const whiteSimulatorGuard: CanActivateFn = (route, state) => {
  return inject(WhiteSimulatorPermissionsService).canViewWhiteSimulator()
}

/**
 * Service de gestion des permissions de la page du simulateur blanc
 */
@Injectable({
  providedIn: 'root',
})
class AllSimulatorPermissionsService {
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)

  /**
   * Vérifie si l'utilisateur peut voir la page du simulateur blanc
   * @returns
   */
  async canAllWhiteSimulator() {
    const user = await this.authService.userConnected()
    return user &&
      user.access &&
      (user.access.indexOf(USER_ACCESS_SIMULATOR) !== -1 ||
        user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR) !== -1 ||
        user.access.indexOf(USER_ACCESS_REAFFECTATOR) !== -1)
      ? true
      : false
  }
}

/**
 * Guard de la page du simulateur blanc
 * @param route
 * @param state
 * @returns
 */
export const allSimulatorGuard: CanActivateFn = (route, state) => {
  return inject(AllSimulatorPermissionsService).canAllWhiteSimulator()
}

/**
 * Service de gestion des permissions de la page du dashboard
 */
@Injectable({
  providedIn: 'root',
})
class DashboardPermissionsService {
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)

  /**
   * Vérifie si l'utilisateur peut voir la page du dashboard
   * @returns
   */
  async canViewDashboard() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_DASHBOARD) !== -1 ? true : false
  }
}

/**
 * Guard de la page du dashboard
 * @param route
 * @param state
 * @returns
 */
export const dashboardGuard: CanActivateFn = (route, state) => {
  return inject(DashboardPermissionsService).canViewDashboard()
}

/**
 * Service de gestion des permissions de la page des ventilations
 */
@Injectable({
  providedIn: 'root',
})
class VentilationsPermissionsService {
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)

  /**
   * Vérifie si l'utilisateur peut voir la page des ventilations
   * @returns
   */
  async canViewVentilations() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_VENTILATIONS) !== -1 ? true : false
  }
}

/**
 * Guard de la page des ventilations
 * @param route
 * @param state
 * @returns
 */
export const ventilationsGuard: CanActivateFn = (route, state) => {
  return inject(VentilationsPermissionsService).canViewVentilations()
}

/**
 * Service de gestion des permissions de la page des activités
 */
@Injectable({
  providedIn: 'root',
})
class ActivitiesPermissionsService {
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)

  /**
   * Vérifie si l'utilisateur peut voir la page des activités
   * @returns
   */
  async canViewActivities() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_ACTIVITIES) !== -1 ? true : false
  }
}

/**
 * Guard de la page des activités
 * @param route
 * @param state
 * @returns
 */
export const activitiesGuard: CanActivateFn = (route, state) => {
  return inject(ActivitiesPermissionsService).canViewActivities()
}
