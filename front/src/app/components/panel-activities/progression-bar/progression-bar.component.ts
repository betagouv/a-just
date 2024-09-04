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
     * Couleur du fond avec opacit"
     */
  @Input() colorOpacity: string = '#000'
  /**
   * Selectionnable
   */
  @Input() selected: boolean = true
  /**
   * Is locked message
   */
  @Input() lockedMessage: string | null = null
  /**
   * Is required for DDG
   */
  @Input() ddg: boolean = false
  /**
   * Remonté au parent du nouveau pourcentage
   */
  @Output() percentChange: EventEmitter<number> = new EventEmitter()

  /**
   * Changement du pourcentage avec une saisie utilisateur
   */
  changePercent() {
    if (this.lockedMessage) {
      alert(this.lockedMessage)
      return
    }

    if (this.selected) {
      const newPercent = prompt(
        'Nouveau pourcentage ?',
        '' + (this.percent || 0)
      )

      if (newPercent === null) {
        return
      }

      const valueFormated =
        parseFloat((newPercent || '').replace(/,/, '.')) || 0
      this.percent = valueFormated
      this.percentChange.emit(this.percent)
    }
  }
}
