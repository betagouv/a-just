import { Component } from '@angular/core'
import { Title } from '@angular/platform-browser'

/**
 * Page de qui sommes nous
 */

@Component({
  templateUrl: './about-us.page.html',
  styleUrls: ['./about-us.page.scss'],
})
export class AboutUsPage {
  /**
   * Constructeur
   * @param title 
   */
  constructor(private title: Title) {
    this.title.setTitle('Qui sommes-nous ? | A-Just')
  }
}
