import { Component, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { BackButtonComponent } from '../../components/back-button/back-button.component'

/**
 * Page de qui sommes nous
 */

@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, BackButtonComponent],
  templateUrl: './about-us.page.html',
  styleUrls: ['./about-us.page.scss'],
})
export class AboutUsPage {
  /**
   * Service de gestion du titre
   */
  title = inject(Title)
  /**
   * Constructeur
   * @param title
   */
  constructor() {
    this.title.setTitle('Qui sommes-nous ? | A-Just')
  }
}
