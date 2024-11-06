import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component';
import { BackButtonComponent } from '../../components/back-button/back-button.component';

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
   * Constructeur
   * @param title
   */
  constructor(private title: Title) {
    this.title.setTitle('Plan du site | A-Just');
  }
}
