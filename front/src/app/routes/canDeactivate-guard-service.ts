import { Injectable } from '@angular/core'
import {
  CanDeactivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router'
import { Observable } from 'rxjs'

/**
* Guard de protection qui empêche un utilisateur de revenir en arrive si des datas ne sont pas enregistrées
*/

export interface IDeactivateComponent {
  canDeactivate: (nextState: string) => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable()
export class CanDeactivateGuardService implements CanDeactivate<IDeactivateComponent> {
  /**
   * Constructeur
   * @param _router 
   */
  constructor(private _router: Router) {}

  /**
   * Check route change
   * @param {ActivatedRouteSnapshot} route  Route from
   * @param {RouterStateSnapshot} state  State of url
   * @param { IDeactivateComponent } component
   * @param {RouterStateSnapshot} nextState
   * @returns true of false if the user has data to save
   */
  canDeactivate(
    component: IDeactivateComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    //console.log('Current Route:', currentRoute)
   /* if (currentRoute.url[0].path === "reaffectateur")
      return component.canDeactivate(nextState.url)*/
    return true
  }
}
