import { Component } from '@angular/core'
import { Title } from '@angular/platform-browser'

/**
 * Données personnelles
 */

@Component({
  templateUrl: './privacy.page.html',
  styleUrls: ['./privacy.page.scss'],
})
export class PrivacyPage {
  /**
   * Constructeur
   * @param title 
   */
  constructor(private title: Title) {
    this.title.setTitle('Protection des données personnelles | A-Just')
  }
}
