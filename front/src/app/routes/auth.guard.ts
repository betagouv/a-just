import { inject, Injectable } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from '../services/auth/auth.service'
import {
  USER_ACCESS_ACTIVITIES_READER,
  USER_ACCESS_AVERAGE_TIME_READER,
  USER_ACCESS_CALCULATOR_READER,
  USER_ACCESS_DASHBOARD_READER,
  USER_ACCESS_REAFFECTATOR_READER,
  USER_ACCESS_SIMULATOR_READER,
  USER_ACCESS_VENTILATIONS_READER,
  USER_ACCESS_WHITE_SIMULATOR_READER,
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
  router = inject(Router)

  async canViewTempsMoyens() {
    const user = await this.authService.userConnected()
    const canView = user && user.access && user.access.indexOf(USER_ACCESS_AVERAGE_TIME_READER) !== -1 ? true : false

    if (!canView) {
      this.authService.redirectUrl = window.location.pathname + window.location.search + window.location.hash
      this.router.navigate(['/login'])
      return false
    }
    return true
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
  router = inject(Router)

  async canViewReaffectator() {
    const user = await this.authService.userConnected()
    const canView = user && user.access && user.access.indexOf(USER_ACCESS_REAFFECTATOR_READER) !== -1 ? true : false

    if (!canView) {
      this.authService.redirectUrl = window.location.pathname + window.location.search + window.location.hash
      this.router.navigate(['/login'])
      return false
    }
    return true
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
  router = inject(Router)

  async canViewCockpit() {
    const user = await this.authService.userConnected()
    const canView = user && user.access && user.access.indexOf(USER_ACCESS_CALCULATOR_READER) !== -1 ? true : false

    if (!canView) {
      this.authService.redirectUrl = window.location.pathname + window.location.search + window.location.hash
      this.router.navigate(['/login'])
      return false
    }
    return true
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
  router = inject(Router)

  async canViewSimulator() {
    const user = await this.authService.userConnected()
    const canView = user && user.access && user.access.indexOf(USER_ACCESS_SIMULATOR_READER) !== -1 ? true : false

    if (!canView) {
      this.authService.redirectUrl = window.location.pathname + window.location.search + window.location.hash
      this.router.navigate(['/login'])
      return false
    }
    return true
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
  router = inject(Router)

  async canViewWhiteSimulator() {
    const user = await this.authService.userConnected()
    const canView = user && user.access && user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR_READER) !== -1 ? true : false

    if (!canView) {
      this.authService.redirectUrl = window.location.pathname + window.location.search + window.location.hash
      this.router.navigate(['/login'])
      return false
    }
    return true
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
  router = inject(Router)
  async canAllWhiteSimulator() {
    const user = await this.authService.userConnected()
    const canView =
      user &&
      user.access &&
      (user.access.indexOf(USER_ACCESS_SIMULATOR_READER) !== -1 ||
        user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR_READER) !== -1 ||
        user.access.indexOf(USER_ACCESS_REAFFECTATOR_READER) !== -1)
        ? true
        : false

    if (!canView) {
      this.authService.redirectUrl = window.location.pathname + window.location.search + window.location.hash
      this.router.navigate(['/login'])
      return false
    }
    return true
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
  router = inject(Router)

  async canViewDashboard() {
    const user = await this.authService.userConnected()
    const canView = user && user.access && user.access.indexOf(USER_ACCESS_DASHBOARD_READER) !== -1 ? true : false

    if (!canView) {
      this.authService.redirectUrl = window.location.pathname + window.location.search + window.location.hash
      this.router.navigate(['/login'])
      return false
    }
    return true
  }
}

export const dashboardGuard: CanActivateFn = (route, state) => {
  return inject(DashboardPermissionsService).canViewDashboard()
}

@Injectable({
  providedIn: 'root',
})
class VentilationsPermissionsService {
  router = inject(Router)
  authService = inject(AuthService)

  async canViewVentilations() {
    const user = await this.authService.userConnected()
    const canView = user && user.access && user.access.indexOf(USER_ACCESS_VENTILATIONS_READER) !== -1 ? true : false

    if (!canView) {
      this.authService.redirectUrl = window.location.pathname + window.location.search + window.location.hash
      this.router.navigate(['/login'])
      return false
    }
    return true
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
    return user && user.access && user.access.indexOf(USER_ACCESS_ACTIVITIES_READER) !== -1 ? true : false
  }
}

export const activitiesGuard: CanActivateFn = (route, state) => {
  return inject(ActivitiesPermissionsService).canViewActivities()
}
