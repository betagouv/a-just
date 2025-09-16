import { Component, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { BackButtonComponent } from '../../components/back-button/back-button.component'

/**
 * Données personnelles
 */

@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, BackButtonComponent],
  templateUrl: './privacy.page.html',
  styleUrls: ['./privacy.page.scss'],
})
export class PrivacyPage {
  /**
   * Service de gestion du titre
   */
  title = inject(Title)

  /**
   * Constructeur
   */
  constructor() {
    this.title.setTitle('Protection des données personnelles | A-Just')
  }
}
