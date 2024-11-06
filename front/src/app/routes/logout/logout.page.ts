import { Component } from '@angular/core';
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
  /**
   * Constructeur
   * @param authService
   * @param userService
   * @param router
   * @param title
   */
  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Vérificiation si l'utilisateur est connecté
   */
  ngOnInit() {
    this.authService.onLogout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
