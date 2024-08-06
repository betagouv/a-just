import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChildren,
  QueryList,
  ElementRef 
} from '@angular/core'
import { FormGroup } from '@angular/forms'
import { Location } from '@angular/common'
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
  selector: 'cover-profil-details',
  templateUrl: './cover-profil-details.component.html',
  styleUrls: ['./cover-profil-details.component.scss'],
})
export class CoverProfilDetailsComponent
  extends MainClass
  implements OnChanges {

  @ViewChildren('input') inputs: QueryList<ElementRef> = new QueryList<ElementRef>()

  /**
   * Fiche courante
   */
  @Input() currentHR: HumanResourceInterface | null = null
  /**
   * Ajout d'un bouton "back" avec un url
   */
  @Input() backUrl: string | undefined
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
   * Categorie courante
   */
  @Input() category: HRCategoryInterface | null = null
  /**
   * Liste des indispo courrante
   */
  @Input() indisponibilities: RHActivityInterface[] = []
  /**
   * Mode d'édition courant
   */
  @Input() onEditIndex: number | null = null
  /**
   * Formulaire
   */
  @Input() basicHrInfo: FormGroup | null = null
  /**
   * Date de début de la situation actuelle
   */
  @Input() dateStart: Date | null = null
  /**
   * Request an PDF export
   */
  @Output() exportPDF = new EventEmitter()
  /**
   * Request to help panel
   */
  @Output() onOpenHelpPanel = new EventEmitter()
  /**
   * Request to to update screen
   */
  @Output() ficheIsUpdated = new EventEmitter()
  /**
   * Temps de travail en text
   */
  timeWorked: string | null = ''
  /**
   * ETP des indispo
   */
  indisponibility: number = 0

  /**
   * Constructeur
   * @param humanResourceService
   */
  constructor(private humanResourceService: HumanResourceService) {
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

    (document.getElementById('firstName') as HTMLElement).innerHTML = this.basicHrInfo?.get('firstName')?.value;
    (document.getElementById('lastName') as HTMLElement).innerHTML = this.basicHrInfo?.get('lastName')?.value;
    (document.getElementById('matricule') as HTMLElement).innerHTML = this.basicHrInfo?.get('matricule')?.value;

    if (this.currentHR && this.currentHR.situations.length) {
      const dateEndToJuridiction =
        this.currentHR && this.currentHR.dateEnd
          ? today(this.currentHR.dateEnd)
          : null
      if (
        dateEndToJuridiction &&
        this.dateStart &&
        dateEndToJuridiction.getTime() <= this.dateStart.getTime()
      ) {
        this.timeWorked = 'Parti'

        // force to memorize last category
        if (this.currentHR && this.currentHR.situations.length) {
          this.category = this.currentHR.situations[0].category
        }
      } else {
        this.timeWorked = etpLabel(this.etp)
      }
    }
  }

  /**
   * Request an PDF export
   */
  onExport() {
    this.exportPDF.emit()
  }

  /**
   * Update form with contenteditable event
   * @param node
   * @param object
   */
  completeFormWithDomObject(
    node: 'firstName' | 'lastName' | 'matricule',
    object: any
  ) {
    const value = object || ' '
    const spanInputElem = document.querySelector(`.input-span-${node}`) as HTMLElement

    if (spanInputElem)
        spanInputElem.innerText = value

    if (this.basicHrInfo) {
      this.basicHrInfo.get(node)?.setValue(object)
      //this.basicHrInfo.get(node)?.setValue(object.srcElement.innerText)
    }
  }

  /**
   * Force to open help panel
   * @param type
   */
  openHelpPanel(type: string | undefined = undefined) {
    this.onOpenHelpPanel.emit(type)
  }

  /**
   * Demande de modification d'une fiche
   * @param nodeName
   * @param value
   */
  async updateHuman(nodeName: string, value: any) {
    if (this.currentHR) {
      if (value && typeof value.innerText !== 'undefined') {
        value = value.innerText
      }

      if ((nodeName === 'dateStart' || nodeName === 'dateEnd') && value) {
        value = new Date(value)
        value.setHours(12)
      }

      this.currentHR = {
        ...this.currentHR,
        [nodeName]: value,
      }

      const newHR = await this.humanResourceService.updatePersonById(this.currentHR, {
        [nodeName]: value,
      })
      this.ficheIsUpdated.emit(newHR)
    }
  }


  /**
   * Bloque le champ de texte à 10 characters maximum
   * @param event
   * @returns
   */
  keyPress(event: any) {
    if (event.which === 8 || event.which === 46) {
      return true
    } else if (event.srcElement.innerHTML.length > 10) {
      return false
    }
    return true
  }

    /**
   * Permet à l'utilisateur de passer d'un input à un autre avec la touche "Entrée"
   * @param event 
   */
  focusNext(event: any) {
    event.preventDefault()
    const inputsArray = this.inputs.toArray();
    const currentIndex = inputsArray.findIndex(input => input.nativeElement === event.target);
    if (currentIndex > -1 && currentIndex < inputsArray.length - 1) {
      inputsArray[currentIndex + 1].nativeElement.focus();
    }
  }
    
    
  /**
   * Empêche la soumission du formulaire lorsque l'utilisateur presse la touche "Entrée"
   * @param event
   */
  preventSubmit(event: any) {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }
}
