import { Component, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { BackButtonComponent } from '../../components/back-button/back-button.component'

/**
 * Mentions légales
 */

@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, BackButtonComponent],
  templateUrl: './legale-notice.page.html',
  styleUrls: ['./legale-notice.page.scss'],
})
export class LegaleNoticePage {
  /**
   * Service de gestion du titre
   */
  title = inject(Title)

  /**
   * Constructeur
   */
  constructor() {
    this.title.setTitle('Mentions légales | A-Just')
  }
}
