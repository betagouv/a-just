
import { Component, Input } from '@angular/core';
import { MainClass } from '../../libs/main-class';

/**
 * Bouton vide dynamique
 */
@Component({
  selector: 'aj-empty-input',
  standalone: true,
  imports: [],
  templateUrl: './empty-input.component.html',
  styleUrls: ['./empty-input.component.scss'],
})
export class EmptyInputComponent extends MainClass {
  /**
   * Titre du bouton
   */
  @Input() title: string | null = null;
  /**
   * Icon affichée sur la droite
   */
  @Input() icon: string | null = null;
  /**
   * Valeure par défaut
   */
  @Input() value: Date | string | undefined | null = null;

  /**
   * Constructeur
   */
  constructor() {
    super();
  }
}
