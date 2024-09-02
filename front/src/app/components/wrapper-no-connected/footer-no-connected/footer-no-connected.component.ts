import {
  Component,
} from '@angular/core'
import { MainClass } from 'src/app/libs/main-class';
import { UserService } from 'src/app/services/user/user.service';

/**
 * Footer à afficher quand on est pas connecté
 */

@Component({
  selector: 'aj-footer-no-connected',
  templateUrl: './footer-no-connected.component.html',
  styleUrls: ['./footer-no-connected.component.scss'],
})
export class FooterNoConnectedComponent extends MainClass {
  /**
   * Constructeur
   */
  constructor(public userService: UserService) {
    super()
  }
}
