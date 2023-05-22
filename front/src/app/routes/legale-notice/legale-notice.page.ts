import { Component } from '@angular/core'
import { Title } from '@angular/platform-browser'

/**
 * Mentions légales
 */

@Component({
  templateUrl: './legale-notice.page.html',
  styleUrls: ['./legale-notice.page.scss'],
})
export class LegaleNoticePage {
  /**
   * Constructeur
   * @param title 
   */
  constructor(private title: Title) {
    this.title.setTitle('Mentions légales | A-Just')
  }
}
