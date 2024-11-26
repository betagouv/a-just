import { Component, Input } from '@angular/core';
import { FooterNoConnectedComponent } from './footer-no-connected/footer-no-connected.component';
import { CommonModule } from '@angular/common';

/**
 * Composant de mise en page en mode non connecté
 */

@Component({
  selector: 'aj-wrapper-no-connected',
  standalone: true,
  imports: [FooterNoConnectedComponent, CommonModule],
  templateUrl: './wrapper-no-connected.component.html',
  styleUrls: ['./wrapper-no-connected.component.scss'],
})
export class WrapperNoConnectedComponent {
  /**
   * Titre de la page du paneau gauche
   */
  @Input() title: string = '';
  /**
   * Affiche ou non le paneau de gauche
   */
  @Input() showLeftPanel: boolean = true;
  /**
   * Ajout ou non de padding sur le contenu
   */
  @Input() contentPadding: boolean = true;
}
