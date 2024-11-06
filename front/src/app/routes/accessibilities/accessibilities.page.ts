import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component';
import { BackButtonComponent } from '../../components/back-button/back-button.component';

/**
 * Accessibilité
 */

@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, BackButtonComponent],
  templateUrl: './accessibilities.page.html',
  styleUrls: ['./accessibilities.page.scss'],
})
export class AccessibilitiesPage {
  /**
   * Constructeur
   * @param title
   */
  constructor(private title: Title) {
    this.title.setTitle('Accessibilité | A-Just');
  }
}
