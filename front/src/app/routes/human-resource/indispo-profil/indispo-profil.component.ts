import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core'
import { FormGroup } from '@angular/forms'
import { sumBy } from 'lodash'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { today } from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'
import { etpLabel } from 'src/app/utils/referentiel'

/**
 * Panneau de présentation d'une fiche
 */

@Component({
  selector: 'indispo-profil',
  templateUrl: './indispo-profil.component.html',
  styleUrls: ['./indispo-profil.component.scss'],
})
export class IndispoProfilComponent extends MainClass {
  /**
   * Liste des indispo courrante
   */
  @Input() indisponibilities: RHActivityInterface[] = []
  /**
   * Request to open help panel
   */
  @Output() onOpenHelpPanel = new EventEmitter()
  /**
   * Event lors du choix d'ajouter une indispo
   */
  @Output() addIndispiniblity = new EventEmitter()

  /**
   * Constructeur
   * @param humanResourceService
   */
  constructor(private humanResourceService: HumanResourceService) {
    super()
  }

  /**
   * Force to open help panel
   * @param type
   */
  openHelpPanel(type: string | undefined = undefined) {
    this.onOpenHelpPanel.emit(type)
  }
}
