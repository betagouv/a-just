import { Component, EventEmitter, Input, Output } from '@angular/core'

/**
 * Component stylé d'une barre de progression en rectangle
 */

@Component({
  selector: 'progression-bar',
  templateUrl: './progression-bar.component.html',
  styleUrls: ['./progression-bar.component.scss'],
})
export class ProgressionBarComponent {
  /**
   * Pourcentage de la progression, 0 - 100
   */
  @Input() percent: number | undefined = 0
  /**
   * Couleur du fond
   */
  @Input() color: string = '#005500'
  /**
   * Selectionnable
   */
  @Input() selected: boolean = true
  /**
   * Remonté au parent du nouveau pourcentage
   */
  @Output() percentChange: EventEmitter<number> = new EventEmitter()

  /**
   * Changement du pourcentage avec une saisie utilisateur
   */
  changePercent() {
    if (this.selected) {
      const newPercent = prompt(
        'Nouveau pourcentage ?',
        '' + (this.percent || 0)
      )

      const valueFormated =
        parseFloat((newPercent || '').replace(/,/, '.')) || 0
      this.percent = valueFormated
      this.percentChange.emit(this.percent)
    }
  }
}
