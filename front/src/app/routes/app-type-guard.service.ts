import { Injectable } from '@angular/core'
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateChild,
} from '@angular/router'
import { Observable } from 'rxjs'
import { UserService } from '../services/user/user.service'

/**
* Guard de protection qui demande si l'application concernée est de type CA ou TJ
*/
@Injectable()
export class AppTypeGuard implements CanActivate, CanActivateChild {
  /**
   * Constructeur
   * @param authService 
   * @param _router 
   */
  constructor(private userService: UserService, private _router: Router) { }

  /**
   * Check route access
   * @param {ActivatedRouteSnapshot} route  Route from
   * @param {RouterStateSnapshot} state  State of url
   * @returns true of false if the user is connected
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkInterfaceType()
  }

  /**
   * Check child route access and make parent rule access
   * @param {ActivatedRouteSnapshot} route  Route from
   * @param {RouterStateSnapshot} state  State of url
   * @returns true of false if the user is connected
   */
  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state)
  }

  /**
   * Assync fonction to check if we connect to CA or TJ infra
   * @returns true of false if the infra is well assigned
   */
  async checkInterfaceType() {
    if (await this.userService.getInterfaceType()) {
      return true
    }

    // Navigate to the login page with extras
    this._router.navigate(['/login'])
    return false
  }
}
