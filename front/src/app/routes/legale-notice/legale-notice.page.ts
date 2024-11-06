import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component';
import { BackButtonComponent } from '../../components/back-button/back-button.component';

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
   * Constructeur
   * @param title
   */
  constructor(private title: Title) {
    this.title.setTitle('Mentions légales | A-Just');
  }
}
