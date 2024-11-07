import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

/**
 * Page de déconnexion
 */

@Component({
  standalone: true,
  imports: [],
  templateUrl: './logout.page.html',
  styleUrls: ['./logout.page.scss'],
})
export class LogoutPage {
  authService = inject(AuthService);
  router = inject(Router);

  /**
   * Vérificiation si l'utilisateur est connecté
   */
  ngOnInit() {
    this.authService.onLogout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
