import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core'
import { HelpButtonComponent } from '../../../components/help-button/help-button.component'
import { MainClass } from '../../../libs/main-class'
import { RHActivityInterface } from '../../../interfaces/rh-activity'
import { MatIconModule } from '@angular/material/icon'
import { UserService } from '../../../services/user/user.service'

/**
 * Panneau de présentation d'une fiche
 */

@Component({
  selector: 'indispo-profil',
  standalone: true,
  imports: [CommonModule, HelpButtonComponent, MatIconModule],
  templateUrl: './indispo-profil.component.html',
  styleUrls: ['./indispo-profil.component.scss'],
})
export class IndispoProfilComponent extends MainClass implements OnChanges {
  userService = inject(UserService)
  /**
   * Liste des indispo courrante
   */
  @Input() indisponibilities: RHActivityInterface[] = []
  /**
   * Indispo en erreur si doublon d'indispo
   */
  @Input() indisponibilityError: string | null = null
  /**
   * Request to open help panel
   */
  @Output() onOpenHelpPanel = new EventEmitter()
  /**
   * Event lors du choix d'ajouter une indispo
   */
  @Output() addIndispiniblity = new EventEmitter()
  /**
   * Liste des indispo courrante
   */
  indisponibilitiesFiltered: RHActivityInterface[] = []

  /**
   * Constructeur
   */
  constructor() {
    super()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['indisponibilities']) {
      this.indisponibilitiesFiltered = this.isBiggerThanArray(this.indisponibilities, 'dateStop')
    }
  }

  /**
   * Force to open help panel
   * @param type
   */
  openHelpPanel(type: string | undefined = undefined) {
    this.onOpenHelpPanel.emit(type)
  }
}
