import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanDeactivateFn,
} from '@angular/router';

/**
 * Guard de protection qui empêche un utilisateur de revenir en arrive si des datas ne sont pas enregistrées
 */

export const closeGuard: CanDeactivateFn<any> = (
  component: any,
  currentRoute: ActivatedRouteSnapshot,
  currentState: RouterStateSnapshot,
  nextState: RouterStateSnapshot
) => {
  if (
    currentRoute.url[0].path === 'reaffectateur' ||
    currentRoute.url[0].path === 'simulateur' ||
    currentRoute.url[0].path === 'referentiel-de-temps'
  ) {
    return component.canDeactivate(nextState.url);
  }
  return true;
};
