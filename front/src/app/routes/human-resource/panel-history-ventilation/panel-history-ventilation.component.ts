import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { sumBy } from 'lodash'
import { EtpPreviewComponent } from '../../../components/etp-preview/etp-preview.component'
import { PanelActivitiesComponent } from '../../../components/panel-activities/panel-activities.component'
import { MainClass } from '../../../libs/main-class'
import { HRFonctionInterface } from '../../../interfaces/hr-fonction'
import { HRCategoryInterface } from '../../../interfaces/hr-category'
import { RHActivityInterface } from '../../../interfaces/rh-activity'
import { ETP_NEED_TO_BE_UPDATED } from '../../../constants/referentiel'
import { fixDecimal } from '../../../utils/numbers'
import { etpLabel } from '../../../utils/referentiel'
import { MatIconModule } from '@angular/material/icon'

/**
 * Paneau d'une situation
 */

@Component({
  selector: 'panel-history-ventilation',
  standalone: true,
  imports: [CommonModule, EtpPreviewComponent, PanelActivitiesComponent, MatIconModule],
  templateUrl: './panel-history-ventilation.component.html',
  styleUrls: ['./panel-history-ventilation.component.scss'],
})
export class PanelHistoryVentilationComponent extends MainClass implements OnChanges {
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
  @Input() etp: number | null = 0
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

    this.indisponibility = fixDecimal(sumBy(this.indisponibilities, 'percent') / 100)
    if (this.indisponibility > 1) {
      this.indisponibility = 1
    }

    if (this.dateEndToJuridiction && this.dateStop && this.dateEndToJuridiction.getTime() < this.dateStop.getTime()) {
      this.timeWorked = 'Parti'
    } else {
      this.timeWorked = etpLabel(this.etp || 0)
    }
  }

  /**
   * Souhait de modifier une situation
   */
  onEditSituation() {
    this.editVentilation.emit(true)
  }
}
