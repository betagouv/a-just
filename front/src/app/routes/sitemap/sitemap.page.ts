import { Component } from '@angular/core'
import { Title } from '@angular/platform-browser'

/**
 * Plan du site
 */

@Component({
  templateUrl: './sitemap.page.html',
  styleUrls: ['./sitemap.page.scss'],
})
export class SiteMapPage {
  /**
   * Constructeur
   * @param title 
   */
  constructor(private title: Title) {
    this.title.setTitle('Plan du site | A-Just')
  }
}
