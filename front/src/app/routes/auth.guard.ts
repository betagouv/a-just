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

@Injectable({
  providedIn: 'root',
})
class PermissionsService {
  authService = inject(AuthService)
  router = inject(Router)

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

export const authGuard: CanActivateFn = (route, state) => {
  return inject(PermissionsService).checkLogin()
}

@Injectable({
  providedIn: 'root',
})
class TempsMoyensPermissionsService {
  authService = inject(AuthService)

  async canViewTempsMoyens() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_AVERAGE_TIME) !== -1 ? true : false
  }
}

export const tempsMoyensGuard: CanActivateFn = (route, state) => {
  return inject(TempsMoyensPermissionsService).canViewTempsMoyens()
}

@Injectable({
  providedIn: 'root',
})
class ReaffectatorPermissionsService {
  authService = inject(AuthService)

  async canViewReaffectator() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_REAFFECTATOR) !== -1 ? true : false
  }
}

export const reaffectatorGuard: CanActivateFn = (route, state) => {
  return inject(ReaffectatorPermissionsService).canViewReaffectator()
}

@Injectable({
  providedIn: 'root',
})
class CockpitPermissionsService {
  authService = inject(AuthService)

  async canViewCockpit() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_CALCULATOR) !== -1 ? true : false
  }
}

export const cockpitGuard: CanActivateFn = (route, state) => {
  return inject(CockpitPermissionsService).canViewCockpit()
}

@Injectable({
  providedIn: 'root',
})
class SimulatorPermissionsService {
  authService = inject(AuthService)

  async canViewSimulator() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_SIMULATOR) !== -1 ? true : false
  }
}

export const simulatorGuard: CanActivateFn = (route, state) => {
  return inject(SimulatorPermissionsService).canViewSimulator()
}

@Injectable({
  providedIn: 'root',
})
class WhiteSimulatorPermissionsService {
  authService = inject(AuthService)

  async canViewWhiteSimulator() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR) !== -1 ? true : false
  }
}

export const whiteSimulatorGuard: CanActivateFn = (route, state) => {
  return inject(WhiteSimulatorPermissionsService).canViewWhiteSimulator()
}

@Injectable({
  providedIn: 'root',
})
class AllSimulatorPermissionsService {
  authService = inject(AuthService)

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

export const allSimulatorGuard: CanActivateFn = (route, state) => {
  return inject(AllSimulatorPermissionsService).canAllWhiteSimulator()
}

@Injectable({
  providedIn: 'root',
})
class DashboardPermissionsService {
  authService = inject(AuthService)

  async canViewDashboard() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_DASHBOARD) !== -1 ? true : false
  }
}

export const dashboardGuard: CanActivateFn = (route, state) => {
  return inject(DashboardPermissionsService).canViewDashboard()
}

@Injectable({
  providedIn: 'root',
})
class VentilationsPermissionsService {
  authService = inject(AuthService)

  async canViewVentilations() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_VENTILATIONS) !== -1 ? true : false
  }
}

export const ventilationsGuard: CanActivateFn = (route, state) => {
  return inject(VentilationsPermissionsService).canViewVentilations()
}

@Injectable({
  providedIn: 'root',
})
class ActivitiesPermissionsService {
  authService = inject(AuthService)

  async canViewActivities() {
    const user = await this.authService.userConnected()
    return user && user.access && user.access.indexOf(USER_ACCESS_ACTIVITIES) !== -1 ? true : false
  }
}

export const activitiesGuard: CanActivateFn = (route, state) => {
  return inject(ActivitiesPermissionsService).canViewActivities()
}
