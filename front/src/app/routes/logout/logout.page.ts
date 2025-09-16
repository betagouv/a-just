import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService } from '../../services/auth/auth.service'

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
  /**
   * Service de gestion de l'authentification
   */
  authService = inject(AuthService)
  /**
   * Service de gestion de la navigation
   */
  router = inject(Router)

  /**
   * Vérificiation si l'utilisateur est connecté
   */
  ngOnInit() {
    this.authService.onLogout().then(() => {
      this.router.navigate(['/'])
    })
  }
}
