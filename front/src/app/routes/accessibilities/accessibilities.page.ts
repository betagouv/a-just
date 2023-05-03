import { Component } from '@angular/core'
import { Title } from '@angular/platform-browser'

/**
 * Accessibilité
 */

@Component({
  templateUrl: './accessibilities.page.html',
  styleUrls: ['./accessibilities.page.scss'],
})
export class AccessibilitiesPage {
  /**
   * Constructeur
   * @param title 
   */
  constructor(private title: Title) {
    this.title.setTitle('Accessibilité | A-Just')
  }
}
