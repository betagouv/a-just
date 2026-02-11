import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, OnChanges, Output, ViewChildren, QueryList, Renderer2, OnInit, inject, ElementRef, ViewChild } from '@angular/core'
import { FormGroup, FormsModule } from '@angular/forms'
import { isNumber, sumBy } from 'lodash'
import { BackButtonComponent } from '../../../components/back-button/back-button.component'
import { HelpButtonComponent } from '../../../components/help-button/help-button.component'
import { DateSelectComponent } from '../../../components/date-select/date-select.component'
import { BigEtpPreviewComponent } from '../big-etp-preview/big-etp-preview.component'
import { AlertSmallComponent } from '../../../components/alert-small/alert-small.component'
import { MainClass } from '../../../libs/main-class'
import { HumanResourceInterface } from '../../../interfaces/human-resource-interface'
import { HRFonctionInterface } from '../../../interfaces/hr-fonction'
import { HRCategoryInterface } from '../../../interfaces/hr-category'
import { RHActivityInterface } from '../../../interfaces/rh-activity'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { UserService } from '../../../services/user/user.service'
import { ReferentielService } from '../../../services/referentiel/referentiel.service'
import { fixDecimal } from '../../../utils/numbers'
import { isDateBiggerThan, today } from '../../../utils/dates'
import { etpLabel } from '../../../utils/referentiel'
import { MatIconModule } from '@angular/material/icon'
import { ExcelService } from '../../../services/excel/excel.service'

/**
 * Panneau de présentation d'une fiche
 */

@Component({
  selector: 'cover-profil-details',
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    FormsModule,
    HelpButtonComponent,
    DateSelectComponent,
    MatIconModule,
    BigEtpPreviewComponent,
    AlertSmallComponent,
  ],
  templateUrl: './cover-profil-details.component.html',
  styleUrls: ['./cover-profil-details.component.scss'],
})
export class CoverProfilDetailsComponent extends MainClass implements OnChanges, OnInit {
  humanResourceService = inject(HumanResourceService)
  excelService = inject(ExcelService)
  @ViewChild('dateStartCalendar') dateStartCalendar: DateSelectComponent | null = null
  @ViewChild('dateEndCalendar') dateEndCalendar: DateSelectComponent | null = null
  @ViewChildren('input')
  inputs: QueryList<ElementRef> = new QueryList<ElementRef>()
  @ViewChildren(DateSelectComponent) calendar!: QueryList<DateSelectComponent>

  userService = inject(UserService)
  referentielService = inject(ReferentielService)
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
  @Input() etp: number | null = null
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
   * Envoie un event au parent pour le focus sur le prochain input
   */
  @Output() focusNext = new EventEmitter<{
    event: any
    calendarType: string | null
  }>()
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
   * Event pour afficher les alertes au niveau du formulaire
   */
  @Output() alertSet = new EventEmitter<{
    tag: string
    remove?: boolean
  }>()
  /**
   * Temps de travail en text
   */
  timeWorked: string | null = ''
  /**
   * ETP des indispo
   */
  indisponibility: number = 0

  /**
   * Taille des champs d'inputs (firstName et LastName)
   */
  inputsWidth: { firstName: number; lastName: number } = {
    firstName: 120,
    lastName: 120,
  }

  /**
   * Constructeur
   * @param humanResourceService
   */
  constructor(private renderer: Renderer2) {
    super()
  }

  /**
   * Déclenchemet à la création du composent
   */
  ngOnInit(): void {
    const firstName = this.currentHR?.firstName || ''
    const lastName = this.currentHR?.lastName || ''

    this.inputsWidth['firstName'] = this.calculateTextWidth(firstName, 'firstName')
    this.inputsWidth['lastName'] = this.calculateTextWidth(lastName, 'lastName')

    this.watch(
      this.basicHrInfo?.get('firstName')?.valueChanges.subscribe((value) => {
        if (value) {
          // Suppression de l'alert
          let index = -1
          index = this.humanResourceService.alertList().indexOf('firstName')
          if (index !== -1) {
            this.alertSet.emit({ tag: 'firstName', remove: true })
          }
        }
      }),
    )

    this.watch(
      this.basicHrInfo?.get('lastName')?.valueChanges.subscribe((value) => {
        if (value) {
          // Suppression de l'alert
          let index = -1
          index = this.humanResourceService.alertList().indexOf('lastName')
          if (index !== -1) {
            this.alertSet.emit({ tag: 'lastName', remove: true })
          }
        }
      }),
    )

    this.watch(
      this.basicHrInfo?.get('startDate')?.valueChanges.subscribe((value) => {
        if (value) {
          // Suppression de l'alert
          let index = -1
          index = this.humanResourceService.alertList().indexOf('startDate')
          if (index !== -1) {
            this.alertSet.emit({ tag: 'startDate', remove: true })
          }
        }
      }),
    )
  }

  /**
   * Detection lors du changement d'une des entrées pour le changement complet du rendu
   */
  ngOnChanges() {
    this.indisponibility = fixDecimal(sumBy(this.indisponibilities, 'percent') / 100)
    if (this.indisponibility > 1) {
      this.indisponibility = 1
    }

    ;(document.getElementById('firstName') as HTMLElement).innerHTML = this.basicHrInfo?.get('firstName')?.value
    ;(document.getElementById('lastName') as HTMLElement).innerHTML = this.basicHrInfo?.get('lastName')?.value
    ;(document.getElementById('matricule') as HTMLElement).innerHTML = this.basicHrInfo?.get('matricule')?.value

    console.log('this.currentHR', this.currentHR)
    if (this.currentHR && this.currentHR.situations.length) {
      const dateEndToJuridiction = this.currentHR && this.currentHR.dateEnd ? today(this.currentHR.dateEnd) : null
      if (dateEndToJuridiction && this.dateStart && dateEndToJuridiction.getTime() <= this.dateStart.getTime()) {
        this.timeWorked = 'Parti'

        // force to memorize last category
        if (this.currentHR && this.currentHR.situations.length) {
          this.category = this.currentHR.situations[0].category
        }
      } else {
        if (this.getEtpValue()) {
          this.timeWorked = etpLabel(this.getEtpValue())
        }
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
  completeFormWithDomObject(node: 'firstName' | 'lastName' | 'matricule', object: any) {
    const value = object || ' '
    const spanInputElem = document.querySelector(`.input-span-${node}`) as HTMLElement

    if (spanInputElem) spanInputElem.innerText = value

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

      if (nodeName === 'dateStart' && value && this.currentHR && this.currentHR.dateEnd && isDateBiggerThan(today(value), today(this.currentHR.dateEnd))) {
        alert("La date d'arrivée ne peut être postérieure ou égale à la date de départ dans la juridiction")
        if (this.dateStartCalendar) {
          this.dateStartCalendar.value = this.currentHR.dateStart
        }

        return
      }

      if (nodeName === 'dateEnd' && value && this.currentHR.dateStart && !isDateBiggerThan(today(value), today(this.currentHR.dateStart), false)) {
        alert('La date de départ ne peut être antérieure à la date d’arrivée dans la juridiction')
        if (this.dateEndCalendar) {
          this.dateEndCalendar.value = this.currentHR.dateEnd
        }

        return
      }

      this.currentHR = {
        ...this.currentHR,
        [nodeName]: value,
      }

      const newHR = await this.humanResourceService.updatePersonById(this.currentHR, {
        [nodeName]: value,
      })

      this.removeAlertItem('startDate')
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
  onFocusNext(event: any, calendarType?: string) {
    this.focusNext.emit({ event: event, calendarType: calendarType ?? null })
  }

  /**
   * Empêche la soumission du formulaire lorsque l'utilisateur presse la touche "Entrée"
   * @param event
   */
  preventSubmit(event: any) {
    if (event.key === 'Enter') {
      event.preventDefault()
    }
  }

  /**
   * Permet l'ajustement de la width des inputs pour le Nom et Prénom
   * @param event
   * @param type
   */
  adjustInputWidth(event: Event, type: 'lastName' | 'firstName') {
    const elem = event.target as HTMLInputElement
    const text = elem.value
    this.inputsWidth[type] = this.calculateTextWidth(text, type)
  }

  /**
   * Calcul la width du text passer en paramètre en prenant en compte
   * la police d'écriture ainsi que la taille
   * @param text
   * @param type
   * @returns
   */
  calculateTextWidth(text: string, type: 'lastName' | 'firstName') {
    const input = document.getElementById(type) as HTMLElement

    const fontFamily = window.getComputedStyle(input).fontFamily
    const fontSize = window.getComputedStyle(input).fontSize

    const span = this.renderer.createElement('span')

    this.renderer.setStyle(span, 'visibility', 'hidden')
    this.renderer.setStyle(span, 'white-space', 'nowrap')
    this.renderer.setStyle(span, 'position', 'absolute')
    this.renderer.setProperty(span, 'textContent', text)
    this.renderer.setStyle(span, 'font-size', fontSize)
    this.renderer.setStyle(span, 'font-family', fontFamily)

    this.renderer.appendChild(document.body, span)

    const width = span.offsetWidth

    this.renderer.removeChild(document.body, span)

    return width + 20
  }
  /**
   * Rerourne la valeur de l'ETP
   * @returns
   */
  getEtpValue(): number {
    const etp = this.etp
    if (etp !== null && isNumber(etp)) {
      return etp
    }
    return 0
  }

  /**
   * Permet de suppimer une alerte sur un des champs du formulaire
   */
  removeAlertItem(tag: string) {
    this.alertSet.emit({ tag, remove: true })
  }

  /**
   *  Permet d'obtenir les calendriers de la page
   */
  getCalendars(): DateSelectComponent[] {
    return this.calendar.toArray()
  }

  /**
   *  Permet d'obtenir les inputs de la page
   */
  getInputs(): ElementRef[] {
    return this.inputs.toArray()
  }
}
