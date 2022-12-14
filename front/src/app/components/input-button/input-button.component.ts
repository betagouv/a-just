import { Component, Input, Output, EventEmitter } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'

/**
 * Champ de saisie textuelle des formulaires prédesigner
 */

@Component({
  selector: 'aj-input-button',
  templateUrl: './input-button.component.html',
  styleUrls: ['./input-button.component.scss'],
})
export class InputButtonComponent extends MainClass {
  /**
   * Titre du bouton
   */
  @Input() title: string | null = null
  /**
   * Champs par défaut affiché en fond
   */
  @Input() placeholder: string | null = null
  /**
   * Icone affichée à droite du champ
   */
  @Input() icon: string = 'search'
  /**
   * Valeure du champs
   */
  @Input() value: string | null = null
  /**
   * Remonter au parent la nouvelle valeure
   */
  @Output() valueChange = new EventEmitter()
  /**
   * Clique sur l'icone pour rechercher
   */
  @Output() search = new EventEmitter()

  /**
   * Constructeur
   */
  constructor() {
    super()
  }

  /**
   * Event du clique sur le bouton
   */
  onSearch() {
    this.search.emit()
  }

  /**
   * Event du changement du texte
   */
  onChange() {
    this.valueChange.emit(this.value)
  }
}
