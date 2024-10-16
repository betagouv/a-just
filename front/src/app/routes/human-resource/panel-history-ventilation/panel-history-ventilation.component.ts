import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core'
import { sumBy } from 'lodash'
import { ETP_NEED_TO_BE_UPDATED } from 'src/app/constants/referentiel'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { fixDecimal } from 'src/app/utils/numbers'
import { etpLabel } from 'src/app/utils/referentiel'

/**
 * Paneau d'une situation
 */

@Component({
  selector: 'panel-history-ventilation',
  templateUrl: './panel-history-ventilation.component.html',
  styleUrls: ['./panel-history-ventilation.component.scss'],
})
export class PanelHistoryVentilationComponent
  extends MainClass
  implements OnChanges
{
  /**
   * Date de début de situation
   */
  @Input() dateStart: Date = new Date()
  /**
   * Date de fin de situation
   */
  @Input() dateStop: Date | null = null
  /**
   * Date de sortie de la jurdiction
   */
  @Input() dateEndToJuridiction: Date | null | undefined = null
  /**
   * Fonction de la situation
   */
  @Input() fonction: HRFonctionInterface | null = null
  /**
   * Category de la situation
   */
  @Input() category: HRCategoryInterface | null = null
  /**
   * ETP de la situation
   */
  @Input() etp: number = 0
  /**
   * Liste des indisponibilités
   */
  @Input() indisponibilities: RHActivityInterface[] = []
  /**
   * Indispo de la periode de la situation
   */
  @Input() activities: RHActivityInterface[] = []
  /**
   * Situation ID
   */
  @Input() id: number | null = null
  /**
   * Bouton de suppression de la situation
   */
  @Input() canRemoveSituation: boolean = false
  /**
   * Bouton de editer de la situation
   */
  @Input() canEditSituation: boolean = false
  /**
   * Force to show sub contentieux
   */
  @Input() forceToShowContentieuxDetail: boolean = false
  /**
   * Date is Past
   */
  @Input() isPast: boolean = false
  /**
   * Event lors du souhait de modifier la situation
   */
  @Output() editVentilation = new EventEmitter()
  /**
   * Event lors du souhait d'ajouter une indispo
   */
  @Output() addIndispiniblity = new EventEmitter()
  /**
   * Event lors du souhait de supprimer une situation
   */
  @Output() onRemove = new EventEmitter()
  /**
   * Somme des indispo
   */
  indisponibility: number = 0
  /**
   * Temps de travail en text
   */
  timeWorked: string | null = ''
  /**
   * ETP need to be updated
   */
  warningETP: boolean = false

  /**
   * Constructeur
   */
  constructor() {
    super()
  }

  /**
   * Lors d'un changement on recalcul l'interface
   */
  ngOnChanges() {
    this.warningETP = this.etp === ETP_NEED_TO_BE_UPDATED

    this.indisponibility = fixDecimal(
      sumBy(this.indisponibilities, 'percent') / 100
    )
    if (this.indisponibility > 1) {
      this.indisponibility = 1
    }

    if (
      this.dateEndToJuridiction &&
      this.dateStop &&
      this.dateEndToJuridiction.getTime() < this.dateStop.getTime()
    ) {
      this.timeWorked = 'Sortie'
    } else {
      this.timeWorked = etpLabel(this.etp)
    }
  }

  /**
   * Souhait de modifier une situation
   */
  onEditSituation() {
    this.editVentilation.emit(true)
  }
}
