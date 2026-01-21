
import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user/user.service';

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'panorama-alert',
  standalone: true,
  imports: [],
  templateUrl: './panorama-alert.component.html',
  styleUrls: ['./panorama-alert.component.scss'],
})
export class PanoramaAlertComponent {
  /**
   * Show hide this view
   */
  showPanel: boolean = true;
  /**
   * Interface type
   */
  interfaceType: string = '';
  /**
   * User service
   */
  userService = inject(UserService);
  /**
   * Constructor
   */
  constructor() {
    this.interfaceType = this.getInterfaceType()
  }

    /**
   * Récuperer le type de l'app
   */
    getInterfaceType() {
      return this.userService.interfaceType === 1 ? "cour d'appel" : 'tribunal judiciaire'
    }
}
