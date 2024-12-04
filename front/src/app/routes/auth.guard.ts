import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
class PermissionsService {
  authService = inject(AuthService);
  router = inject(Router);

  async checkLogin() {
    if (await this.authService.userConnected()) {
      return true;
    }

    this.authService.redirectUrl =
      window.location.pathname + window.location.search + window.location.hash;

    // Navigate to the login page with extras
    this.router.navigate(['/login']);
    return false;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  return inject(PermissionsService).checkLogin();
};
