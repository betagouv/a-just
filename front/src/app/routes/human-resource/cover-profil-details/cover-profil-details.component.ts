import {
  Component,
  Input,
  OnChanges,
} from '@angular/core'
import { sumBy } from 'lodash'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { fixDecimal } from 'src/app/utils/numbers'

/**
 * Panneau de présentation d'une fiche
 */

@Component({
  selector: 'cover-profil-details',
  templateUrl: './cover-profil-details.component.html',
  styleUrls: ['./cover-profil-details.component.scss'],
})
export class CoverProfilDetailsComponent
  extends MainClass
  implements OnChanges
{
  /**
   * Fiche courante
   */
  @Input() currentHR: HumanResourceInterface | null = null
  /**
  * Ajout d'un bouton "back" avec un url
  */
 @Input() backUrl: string = ''
 /**
  * Ajouter d'une ancre sur le lien de retour
  */
 @Input() backAnchor: string | undefined
  /**
   * Affiche l'ETP calculé
   */
  @Input() etp: number = 0
  /**
   * Fonction courante
   */
  @Input() fonction: HRFonctionInterface | null = null
  /**
   * Liste des indispo courrante
   */
  @Input() indisponibilities: RHActivityInterface[] = []
  /**
   * Temps de travail en text
   */
  timeWorked: string = ''
  /**
   * ETP des indispo
   */
  indisponibility: number = 0

  /**
   * Constructeur
   * @param humanResourceService 
   */
  constructor(
    private humanResourceService: HumanResourceService
  ) {
    super()
  }

  /**
   * Detection lors du changement d'une des entrées pour le changement complet du rendu
   */
  ngOnChanges() {
    this.indisponibility = fixDecimal(
      sumBy(this.indisponibilities, 'percent') / 100
    )
    if (this.indisponibility > 1) {
      this.indisponibility = 1
    }

    /*const dateEndToJuridiction = this.currentHR && this.currentHR.dateEnd ? today(this.currentHR.dateEnd) : null
    if (
      dateEndToJuridiction &&
      this.dateStart &&
      dateEndToJuridiction.getTime() <= this.dateStart.getTime()
    ) {
      this.timeWorked = 'Parti'
    } else {
      this.timeWorked = etpLabel(this.etp)
    }*/
  }
}
