import { Injectable } from '@angular/core'
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateChild,
} from '@angular/router'
import { Observable } from 'rxjs'
import { AuthService } from '../services/auth/auth.service'  

/**
* Guard de protection qui demande un token utilisateur et confirme avec le serveur qu'il est valide.
*/

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  /**
   * Constructeur
   * @param authService 
   * @param _router 
   */
  constructor(private authService: AuthService, private _router: Router) {}

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
    const url: string = state.url

    return this.checkLogin(url)
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
   * Assync fonction who connect to server and check the user token value
   * @param {string} url to redirect if not authorise to access
   * @returns true of false if the user is connected
   */
  async checkLogin(url: string) {
    if (await this.authService.userConnected()) {
      return true
    }

    this.authService.redirectUrl = url

    // Navigate to the login page with extras
    this._router.navigate(['/login'])
    return false
  }
}
