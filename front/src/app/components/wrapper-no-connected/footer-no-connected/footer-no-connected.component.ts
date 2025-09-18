import { Component, inject } from '@angular/core'
import { MainClass } from '../../../libs/main-class'
import { UserService } from '../../../services/user/user.service'

/**
 * Footer à afficher quand on est pas connecté
 */

@Component({
  selector: 'aj-footer-no-connected',
  standalone: true,
  imports: [],
  templateUrl: './footer-no-connected.component.html',
  styleUrls: ['./footer-no-connected.component.scss'],
})
export class FooterNoConnectedComponent extends MainClass {
  /**
   * Service de gestion des utilisateurs
   */
  userService = inject(UserService)
  /**
   * Constructeur
   */
  constructor() {
    super()
  }
}
