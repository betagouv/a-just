import { inject, Injectable } from '@angular/core'
import { Router, CanActivateFn } from '@angular/router'
import { UserService } from '../services/user/user.service'

/**
 * Guard de protection qui demande si l'application concernée est de type CA ou TJ
 */
@Injectable({
  providedIn: 'root',
})
class TypeGuardService {
  /**
   * Service de gestion de l'utilisateur
   */
  userService = inject(UserService)
  /**
   * Service de navigation
   */
  router = inject(Router)
  /**
   * Vérifie le type de l'interface
   * @returns
   */
  async checkInterfaceType() {
    await this.userService.getInterfaceType()
    return true
  }
}

/**
 * Guard de protection qui demande si l'application concernée est de type CA ou TJ
 * @param route
 * @param state
 * @returns
 */
export const typeGuard: CanActivateFn = (route, state) => {
  return inject(TypeGuardService).checkInterfaceType()
}
