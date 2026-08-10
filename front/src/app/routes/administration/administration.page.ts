import { Component, inject } from '@angular/core'
import { WrapperComponent } from '../../components/wrapper/wrapper.component'
import { MainClass } from '../../libs/main-class'
import { UserService } from '../../services/user/user.service'
import { CommonModule } from '@angular/common'
import { AdministrationUsersComponent } from './administration-users/administration-users.component'

/**
 * Page d'administration de la juridiction pour les administrateurs locaux
 */
@Component({
  standalone: true,
  imports: [WrapperComponent, CommonModule, AdministrationUsersComponent],
  templateUrl: './administration.page.html',
  styleUrls: ['./administration.page.scss'],
})
export class AdministrationPage extends MainClass {
  userService = inject(UserService)

  /**
   * Constructor
   */
  constructor() {
    super()
  }
}
