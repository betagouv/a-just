import { Component } from '@angular/core'
import { Title } from '@angular/platform-browser'

/**
 * CGU
 */

@Component({
  templateUrl: './cgu.page.html',
  styleUrls: ['./cgu.page.scss'],
})
export class CGUPage {
  /**
   * Constructeur
   * @param title 
   */
  constructor(private title: Title) {
    this.title.setTitle('Conditions générales d\'utilisation | A-Just')
  }
}
