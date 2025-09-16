import { Component, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { BackButtonComponent } from '../../components/back-button/back-button.component'

/**
 * Plan du site
 */

@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, BackButtonComponent],
  templateUrl: './sitemap.page.html',
  styleUrls: ['./sitemap.page.scss'],
})
export class SiteMapPage {
  /**
   * Service de gestion du titre
   */
  title = inject(Title)

  /**
   * Constructeur
   */
  constructor() {
    this.title.setTitle('Plan du site | A-Just')
  }
}
