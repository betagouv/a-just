import { inject, Injectable } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserService } from '../services/user/user.service';

/**
 * Guard de protection qui demande si l'application concernée est de type CA ou TJ
 */
@Injectable({
  providedIn: 'root',
})
class TypeGuardService {
  userService = inject(UserService);
  router = inject(Router);

  async checkInterfaceType() {
    if (await this.userService.getInterfaceType()) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}

export const typeGuard: CanActivateFn = (route, state) => {
  return inject(TypeGuardService).checkInterfaceType();
};
