import { Component, Input, OnChanges, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef, inject, effect } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { sumBy } from 'lodash'
import * as xlsx from 'xlsx'
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel'
import { CommonModule } from '@angular/common'
import { PopupComponent } from '../../../components/popup/popup.component'
import { CalculatriceComponent } from '../../../components/calculatrice/calculatrice.component'
import { PanelActivitiesComponent } from '../../../components/panel-activities/panel-activities.component'
import { AlertSmallComponent } from '../../../components/alert-small/alert-small.component'
import { MainClass } from '../../../libs/main-class'
import { HumanResourceInterface } from '../../../interfaces/human-resource-interface'
import { RHActivityInterface } from '../../../interfaces/rh-activity'
import { HRCategoryInterface } from '../../../interfaces/hr-category'
import { HRFonctionInterface } from '../../../interfaces/hr-fonction'
import { HRFonctionService } from '../../../services/hr-fonction/hr-function.service'
import { HRCategoryService } from '../../../services/hr-category/hr-category.service'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { ReferentielService } from '../../../services/referentiel/referentiel.service'
import { AppService } from '../../../services/app/app.service'
import { CalculatriceService } from '../../../services/calculatrice/calculatrice.service'
import { ServerService } from '../../../services/http-server/server.service'
import { fixDecimal } from '../../../utils/numbers'
import { downloadFile } from '../../../utils/system'
import {
  CALCULATE_DOWNLOAD_URL,
  DOCUMENTATION_VENTILATEUR_PERSON_CA,
  DOCUMENTATION_VENTILATEUR_PERSON_TJ,
  IMPORT_ETP_TEMPLATE,
  IMPORT_ETP_TEMPLATE_CA,
  NOMENCLATURE_DOWNLOAD_URL,
  NOMENCLATURE_DOWNLOAD_URL_CA,
  NOMENCLATURE_DROIT_LOCAL_DOWNLOAD_URL,
} from '../../../constants/documentation'
import { findRealValueCustom, isDateBiggerThan, setTimeToMidDay, today } from '../../../utils/dates'
import { MatIconModule } from '@angular/material/icon'
import { DateSelectComponent } from '../../../components/date-select/date-select.component'
import { HelpButtonComponent } from '../../../components/help-button/help-button.component'
import { ExcelService } from '../../../services/excel/excel.service'
import { UserService } from '../../../services/user/user.service'

export interface importedVentillation {
  referentiel: ContentieuReferentielInterface
  percent: number | undefined
  parentReferentiel: ContentieuReferentielInterface | null
}

export interface importedSituation {
  index: number | null
  ventillation: importedVentillation[]
}

/**
 * Panneau pour ajouter / modifier une situation
 * indispos, etp, category, fonction, date début
 */

@Component({
  selector: 'add-ventilation',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    PopupComponent,
    CalculatriceComponent,
    PanelActivitiesComponent,
    MatIconModule,
    ReactiveFormsModule,
    DateSelectComponent,
    HelpButtonComponent,
    AlertSmallComponent,
  ],
  templateUrl: './add-ventilation.component.html',
  styleUrls: ['./add-ventilation.component.scss'],
})
export class AddVentilationComponent extends MainClass implements OnChanges {
  humanResourceService = inject(HumanResourceService)
  @ViewChild('bottomContainerTarget') bottomContainerTargetRef!: ElementRef

  /**
   * Fiche
   */
  @Input() human: HumanResourceInterface | null = null
  /**
   * Liste de toutes les indispo d'une fiche
   */
  @Input() indisponibilities: RHActivityInterface[] = []
  /**
   * Liste des ventilations en court de modification
   */
  @Input() activities: RHActivityInterface[] = []
  /**
   * Date de début de la situation
   */
  @Input() lastDateStart: Date | null = null
  /**
   * Date de fin estimé de la situation
   */
  @Input() dateStop: Date | null = null
  /**
   * Indispo en erreur si doublon d'indispo
   */
  @Input() indisponibilityError: string | null = null
  /**
   * Active les boutons de sauvegarde
   */
  @Input() saveActions: boolean = false
  /**
   * Modification / Création d'une situation
   */
  @Input() isEdit: boolean = false
  /**
   * Id de situation
   */
  @Input() editId: number | null = null
  /**
   * Parent form
   */
  @Input() basicData: FormGroup | null = null
  /**
   * Force to show sub contentieux
   */
  @Input() forceToShowContentieuxDetail: boolean = false
  /**
   * Indice de la situation édité
   */
  @Input() indexSituation: number | null = null
  /**
   * Fonction pour mettre à jour l'ETP (lors de la création d'un nouvel agent)
   */
  @Input() setValueEtp: (val: number | null) => void = () => {}
  /**
   * Event lors de la sauvegarde
   */
  @Output() onSaveConfirm = new EventEmitter()
  /**
   * Event lors de la demande d'ajout d'une indispo
   */
  @Output() addIndispiniblity = new EventEmitter()
  /**
   * Event fermeture du paneau
   */
  @Output() close = new EventEmitter()
  /**
   * Event pour ouvrir le paneau d'aide
   */
  @Output() onOpenHelpPanel = new EventEmitter()
  /**
   * Event pour afficher les alertes au niveau du formulaire
   */
  @Output() alertSet = new EventEmitter<{
    tag: string
    remove?: boolean
  }>()
  /**
   * Réferentiel des indispo
   */
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = []
  /**
   * Liste des catégories (magistrat, greffier...)
   */
  categories: HRCategoryInterface[] = []
  /**
   * Liste des fonctions (1VP, VP, ...)
   */
  fonctions: HRFonctionInterface[] = []
  /**
   * Referentiel avec les activités
   */
  updatedReferentiels: ContentieuReferentielInterface[] = []
  /**
   * ETP
   */
  etp: number = 1
  /**
   * Formulaire de saisie
   */
  form = new FormGroup({
    activitiesStartDate: new FormControl<Date | null>(null, [Validators.required]),
    etp: new FormControl<number | null>(null, [Validators.min(0), Validators.max(1)]),
    fonctionId: new FormControl<number | null>(null, [Validators.required]),
    categoryId: new FormControl<number | null>(null, [Validators.required]),
  })
  /**
   * Activation de la calculatrice
   */
  calculatriceIsActive: boolean = false
  /**
   * Ouverture de la calculatrice
   */
  openCalculatricePopup: boolean = false
  /**
   * Affichage du menu déroulant
   */
  toggleDropDown: boolean = false
  /**
   * Fonction importée
   */
  importedFunction: number | null = null
  /**
   * Import de fichié effectué
   */
  displayImportLabels = false
  /**
   * Somme des valeurs importés
   */
  sumPercentImported = 0
  /**
   * Liste des indispo courrante
   */
  indisponibilitiesFiltered: RHActivityInterface[] = []
  /**
   * Afficher erreur date de début
   */
  printErrorDateStart: boolean = false
  /**
   * Import
   */
  imported = false

  /**
   * Constructeur
   * @param hrFonctionService
   * @param hrCategoryService
   * @param appService
   */
  constructor(
    private hrFonctionService: HRFonctionService,
    private hrCategoryService: HRCategoryService,
    private appService: AppService,
    private calculatriceService: CalculatriceService,
    private serverService: ServerService,
    private userService: UserService,
    private excelService: ExcelService,
    private referentielService: ReferentielService,
  ) {
    super()
  }

  /**
   * Au chargement charger les catégories et fonctions
   */
  ngOnInit() {
    window.addEventListener('click', this.onclick.bind(this))
    window.addEventListener('click', this.onclick2.bind(this))
    this.watch(this.hrFonctionService.getAll().then(() => this.loadCategories()))
    this.watch(this.hrCategoryService.getAll().then((list) => (this.categories = list)))
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(
        () => (this.allIndisponibilityReferentiel = this.humanResourceService.allIndisponibilityReferentiel.slice(1)),
      ),
    )
    this.watch(
      this.form.get('categoryId')?.valueChanges.subscribe(() => {
        this.loadCategories().then(() => {
          let fct = null
          if (this.displayImportLabels) {
            fct = this.fonctions.find((c) => c.id === this.importedFunction)
          } else {
            fct = this.fonctions[0]
          }
          this.form.get('fonctionId')?.setValue(fct?.id || null)
          if (fct) this.calculatriceIsActive = fct.calculatrice_is_active || false

          // // Suprpession de l'alerte
          let index = -1
          index = this.humanResourceService.alertList().indexOf('category')
          if (index !== -1) {
            this.alertSet.emit({ tag: 'category', remove: true })
          }
          index = this.humanResourceService.alertList().indexOf('fonction')
          if (index !== -1) {
            this.alertSet.emit({ tag: 'fonction', remove: true })
          }
        })
      }),
    )

    this.watch(
      this.form.get('etp')?.valueChanges.subscribe((value) => {
        console.log('value', value)
        if (value) {
          const valueFormated = parseFloat((value || '') + ''.replace(/,/, '.'))

          if (valueFormated < 0) {
            alert('Le pourcentage ne peut pas être négatif')
            return
          }

          if (Number.isNaN(valueFormated)) {
            alert("La valeur saisie n'est pas un nombre")
            return
          }

          if (value > 1) value = 1
          else if (value < 0) value = 0
          let str_value = value?.toString()
          let validationPattern = /^\d+(\.\d{0,2})?$/

          if (!validationPattern.test(str_value)) {
            value = this.parseFloat(str_value.substring(0, str_value.length - 1))
          }
          this.form.get('etp')?.setValue(value, { emitEvent: false })
          this.setValueEtp(value)
        } else {
          // Remise à 0 de l'ETP si la valeur est null (ex: user efface la valeur précédement entrée) pour remtrre l'ETP du composant big-et-preview à null
          this.setValueEtp(value)
        }
        // Suppression de l'alert
        let index = -1
        index = this.humanResourceService.alertList().indexOf('etp')
        if (index !== -1) {
          this.alertSet.emit({ tag: 'etp', remove: true })
        }
      }),
    )

    this.watch(
      this.form.get('activitiesStartDate')?.valueChanges.subscribe((value) => {
        if (value) {
          // Suppression de l'alert
          let index = -1
          index = this.humanResourceService.alertList().indexOf('activitiesStartDate')
          if (index !== -1) {
            this.alertSet.emit({ tag: 'activitiesStartDate', remove: true })
          }
        }
      }),
    )
  }

  /**
   * Initilisation lors du changement de la date
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['lastDateStart'] && changes['lastDateStart'].firstChange) {
      this.onStart()
    }
    if (changes['indisponibilities']) {
      this.indisponibilitiesFiltered = [
        ...this.indisponibilities.filter(
          (i) =>
            i.id < 0 || !i.dateStop || today(i.dateStart).getTime() >= today().getTime() || (i.createdAt && today(i.createdAt).getTime() >= today().getTime()),
        ),
      ]
    }
  }

  /**
   * Initialisation du formulaire
   */
  onStart() {
    const situation = this.humanResourceService.findSituation(this.human, this.lastDateStart ? this.lastDateStart : undefined)

    let etp = situation && situation.etp !== undefined ? situation.etp : null
    if (etp === this.ETP_NEED_TO_BE_UPDATED) {
      etp = 0
    }
    this.etp = etp
    this.form.get('activitiesStartDate')?.setValue(this.isEdit && this.lastDateStart ? new Date(this.lastDateStart) : null)
    this.form.get('etp')?.setValue(etp === null ? null : fixDecimal(etp))
    this.form.get('categoryId')?.setValue((situation && situation.category && situation.category.id) || null)

    this.form.get('fonctionId')?.setValue((situation && situation.fonction && situation.fonction.id) || null)

    const fonctions = this.humanResourceService.fonctions.getValue()
    const fonct = fonctions.find((c) => c.id == this.form.get('fonctionId')?.value, this.form.get('categoryId')?.value)
    if (fonct) this.calculatriceIsActive = fonct.calculatrice_is_active || false

    this.loadCategories()
  }

  /**
   * Destruction des observables
   */
  ngOnDestroy(): void {
    this.watcherDestroy()
  }

  /**
   * Filtre des fonctions en fonction des categories
   */
  async loadCategories() {
    if (this.form.value) {
      const foncts = (await this.hrFonctionService.getAll()).filter((c) => this.form.value?.categoryId == c.categoryId)

      if (JSON.stringify(foncts) !== JSON.stringify(this.fonctions)) {
        this.fonctions = foncts
      }
    }
  }

  /**
   * Control du formulaire lors de la sauvegarde
   * @returns
   */
  async onSave(withoutPercentControl = false, saveETPT0 = false) {
    let { activitiesStartDate, categoryId, fonctionId } = this.form.value
    const categories = this.humanResourceService.categories.getValue()
    const fonctions = this.humanResourceService.fonctions.getValue()
    const cat = categories.find((c) => categoryId && c.id == categoryId)
    const fonct = fonctions.find((c) => c.id == fonctionId)

    //const indisponibilites = this.human?.indisponibilities || []

    /***
     * Je supprime le check si l'indisponibilité est ignorée pour la ventilation car on ne sais plus pourquoi on a fait ce check
     */
    //const checkIfIndispoIgnoreControlPercentVentilation = indisponibilites.some((c) => c.contentieux.checkVentilation === false)

    this.humanResourceService.alertList.set([])

    if (this.basicData!.controls['firstName'].value === '' || this.basicData!.controls['firstName'].value === 'Prénom') {
      this.humanResourceService.alertList.update((list) => [...list, 'firstName'])
    }

    if (this.basicData!.controls['lastName'].value === '' || this.basicData!.controls['lastName'].value === 'Nom') {
      this.humanResourceService.alertList.update((list) => [...list, 'lastName'])
    }

    console.log('this.human', this.human)
    if (this.human && !this.human.dateStart) {
      this.humanResourceService.alertList.update((list) => [...list, 'startDate'])
    } else {
      this.humanResourceService.removeAlert('startDate')
    }

    if (!cat) {
      this.humanResourceService.alertList.update((list) => [...list, 'category'])
    } else {
      this.humanResourceService.removeAlert('category')
    }

    if (!fonct) {
      this.humanResourceService.alertList.update((list) => [...list, 'fonction'])
    } else {
      this.humanResourceService.removeAlert('fonction')
    }

    const etp = this.form.get('etp')?.value
    if (etp === null) {
      this.humanResourceService.alertList.update((list) => [...list, 'etp'])
    }

    if (!activitiesStartDate) {
      this.humanResourceService.alertList.update((list) => [...list, 'activitiesStartDate'])
      this.printErrorDateStart = true
    }

    if (this.humanResourceService.alertList().length > 0) {
      console.log('alertList', this.humanResourceService.alertList)
      this.humanResourceService.alertList().map((tag) => {
        this.alertSet.emit({ tag })
      })
      return
    }

    activitiesStartDate = setTimeToMidDay(today(activitiesStartDate)) || today(activitiesStartDate)

    if (this.human && this.human.dateStart && activitiesStartDate) {
      const dateStart = today(this.human.dateStart)
      // check activity date
      if (activitiesStartDate.getTime() < dateStart.getTime()) {
        alert("Vous ne pouvez pas saisir une situation antérieure à la date d'arrivée !")
        return
      }
    }

    if (this.human && this.human.dateEnd && activitiesStartDate) {
      const dateEnd = new Date(this.human.dateEnd)

      // check activity date
      if (activitiesStartDate.getTime() > dateEnd.getTime()) {
        alert('Vous ne pouvez pas saisir une situation postérieure à la date de départ !')
        return
      }
    }

    if (this.indisponibilityError) {
      alert(this.indisponibilityError)
      return
    }

    if (!withoutPercentControl) {
      const totalAffected = fixDecimal(sumBy(this.updatedReferentiels, 'percent'))
      if (totalAffected > 100) {
        this.appService.alert.next({
          title: 'Attention',
          text: `Avec les autres affectations, vous avez atteint un total de ${totalAffected}% de ventilation ! Vous ne pouvez passer au dessus de 100%.`,
        })
        return
      } else if (totalAffected < 100) {
        this.appService.alert.next({
          title: 'La ventilation de cet agent est incomplète',
          text: `La ventilation de l’ensemble des activités d’un agent en poste dans la juridiction doit systématiquement atteindre 100% de son temps de travail, même en cas de temps partiel ou d’indisponibilité.<br/><br/>Il vous reste à compléter ${fixDecimal(
            100 - totalAffected,
          )}% de l’activité totale de cet agent.<br/><br/>Pour en savoir plus, <a href="${this.userService.isTJ() ? DOCUMENTATION_VENTILATEUR_PERSON_TJ : DOCUMENTATION_VENTILATEUR_PERSON_CA}" target="_blank" rel="noreferrer">cliquez ici</a>`,
          secondaryText: 'Compléter la situation',
          callbackSecondary: () => {
            this.scrollToBottomElement()
          },
          okText: "Enregistrer en l'état",
          callback: () => {
            this.onSave(true, saveETPT0)
          },
        })
        return
      }
    }

    if (!fonct || !cat) return

    if (fonct.minDateAvalaible && !isDateBiggerThan(today(activitiesStartDate), today(fonct.minDateAvalaible))) {
      alert(
        `Date de début de situation à corriger ! La fonction ${fonct.label} n’entre en vigueur qu’à compter du ${findRealValueCustom(
          fonct.minDateAvalaible,
          false,
        )}.`,
      )
      return
    }

    if (etp === 0) {
      if (!saveETPT0) {
        this.appService.alert.next({
          title: 'L’ETPT saisi est de 0 :',
          text: `- si cet agent fait toujours partie de vos effectifs mais est absent temporairement, indiquez son temps de travail théorique et enregistrez un motif d’indisponibilité<br/><br/>- s’il a quitté la juridiction, renseignez une date de sortie.<br/><br/>L’ETPT à 0 est réservé à quelques cas particuliers où l’agent continue à faire  administrativement partie de la juridiction sans décompter d’ETPT (ex. congé parental supérieur à 6 mois, CLD, détachement… pour plus de détails cliquez <a href="https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/ventiler-ses-effectifs/focus-sur-les-changements-de-situation-administrative/indisponibilites-particulieres" target="_blank">ici</a>)`,
          secondaryText: 'Modifier l’ETPT',
          callbackSecondary: () => {},
          okText: "Confirmer l'ETPT à 0",
          callback: () => {
            this.onSave(withoutPercentControl, true)
          },
        })
        return
      }
    }

    const situations = this.generateAllNewSituations(this.updatedReferentiels, activitiesStartDate, { ...this.form.value, etp }, cat, fonct)

    if (this.human) {
      if (
        await this.humanResourceService.updatePersonById(this.human, {
          firstName: this.basicData!.controls['firstName'].value,
          lastName: this.basicData!.controls['lastName'].value,
          matricule: this.basicData!.controls['matricule'].value,
          situations,
          indisponibilities: this.indisponibilities,
        })
      ) {
        this.onSaveConfirm.emit()
      }
    }
  }

  /**
   * Reformatage des situations
   * @param newReferentiel
   * @param activitiesStartDate
   * @param profil
   * @param cat
   * @param fonct
   * @returns
   */
  generateAllNewSituations(
    newReferentiel: ContentieuReferentielInterface[],
    activitiesStartDate: Date,
    profil: any,
    cat: HRCategoryInterface,
    fonct: HRFonctionInterface,
  ) {
    let situations = this.human?.situations || []

    console.log('Situations:', situations, newReferentiel, activitiesStartDate, this.editId)

    const activities: any[] = []
    newReferentiel
      .filter((r) => r.percent && r.percent > 0)
      .map((r) => {
        activities.push({
          percent: r.percent || 0,
          contentieux: r,
        })
        ;(r.childrens || [])
          .filter((r) => r.percent && r.percent > 0)
          .map((child) => {
            activities.push({
              percent: child.percent || 0,
              contentieux: child,
            })
          })
      })

    // find if situation is in same date
    const isSameDate = situations.findIndex((s) => {
      const day = today(s.dateStart)
      return activitiesStartDate.getTime() === day.getTime() && s.id !== this.editId
    })
    console.log('isSameDate:', isSameDate)

    const options = {
      etp: profil.etp,
      category: cat,
      fonction: fonct,
      activities,
    }

    if (isSameDate !== -1) {
      situations[isSameDate] = {
        ...situations[isSameDate],
        ...options,
      }

      situations = situations.filter((s) => s.id !== this.editId)
    } else if (this.editId !== -1 && this.editId !== null) {
      const index = situations.findIndex((s) => s.id === this.editId)
      if (index !== -1) {
        situations[index] = {
          ...situations[index],
          ...options,
          dateStart: activitiesStartDate,
        }
      }
    } else {
      situations.splice(0, 0, {
        id: -1,
        ...options,
        dateStart: activitiesStartDate,
      })
    }

    return situations
  }

  /**
   * Retour du référentiel en fonction du paneau d'activité
   * @param referentiels
   */
  onNewReferentiel(referentiels: ContentieuReferentielInterface[]) {
    this.updatedReferentiels = referentiels
    this.sumPercentImported = this.updatedReferentiels.reduce((sum, c) => sum + (c.percent || 0), 0)
  }

  /**
   * Show panel to help
   * @param type
   */
  openHelpPanel(type: string) {
    this.onOpenHelpPanel.emit(type)
  }

  convertirEtpt() {
    if (this.calculatriceService.dataCalculatrice.getValue().selectedTab === 'volume') {
      if (this.calculatriceService.dataCalculatrice.getValue().volume.value !== null) {
        this.openCalculatricePopup = false
        this.form.get('etp')?.setValue(fixDecimal(this.calculatriceService.computeEtptCalculatrice(String(this.form.get('categoryId')?.value || 1))))
      }
    } else if (this.calculatriceService.dataCalculatrice.getValue().selectedTab === 'vacation') {
      if (
        this.calculatriceService.dataCalculatrice.getValue().vacation.value !== null &&
        this.calculatriceService.dataCalculatrice.getValue().vacation.unit !== null
      ) {
        this.openCalculatricePopup = false
        this.form.get('etp')?.setValue(fixDecimal(this.calculatriceService.computeEtptCalculatrice(String(this.form.get('categoryId')?.value || 1))))
      }
    }
  }

  setFonc(event: any) {
    const fonctions = this.humanResourceService.fonctions.getValue()
    const fonct = fonctions.find((c) => c.id == this.form.get('fonctionId')?.value, event.value)
    if (fonct) this.calculatriceIsActive = fonct.calculatrice_is_active || false
  }

  async downloadCalculator() {
    await this.serverService
      .post('centre-d-aide/log-documentation-link', {
        value: CALCULATE_DOWNLOAD_URL,
      })
      .then((r) => {
        return r.data
      })
    window.open(CALCULATE_DOWNLOAD_URL)
  }

  async downloadAsset(type: string, download = false) {
    let url = null
    console.log('Type:', type)
    if (type === 'nomencalture') {
      if (this.userService.isCa()) {
        url = NOMENCLATURE_DOWNLOAD_URL_CA
      } else {
        if (this.referentielService.isDroitLocal()) {
          url = NOMENCLATURE_DROIT_LOCAL_DOWNLOAD_URL
        } else {
          url = NOMENCLATURE_DOWNLOAD_URL
        }
      }
    } else if (type === 'calculator') {
      await this.serverService
        .post('centre-d-aide/log-documentation-link', {
          value: CALCULATE_DOWNLOAD_URL,
        })
        .then((r) => {
          return r.data
        })
      window.open(CALCULATE_DOWNLOAD_URL)
    }

    if (url) {
      if (download) {
        downloadFile(url)
      } else {
        window.open(url)
      }
    }
  }

  async downloadEtpTemplate() {
    await this.serverService
      .post('centre-d-aide/log-documentation-link', {
        value: IMPORT_ETP_TEMPLATE,
      })
      .then((r) => {
        return r.data
      })
    this.excelService.generateAgentFile()
  }

  /**
   * Récupère le nom d'une catégorie
   */
  getCategoryLabel() {
    const cat = this.categories.find((c) => this.form.get('categoryId')?.value == c.id) || null
    return cat
  }

  /**
   * Interprete le fichier Excel importé par l'utilisateur
   * @param event
   * @param element
   */
  getFile(event: any, element: HTMLInputElement) {
    const file = event.target.files[0]

    const classe = {
      codeImport: null,
      value: null,
    }

    this.fileReader(file, classe, event)
    this.imported = true
    element.value = ''
  }

  private fileReader(file: any, line: any, event: any) {
    let fileReader = new FileReader()
    fileReader.onload = (e) => {
      let arrayBuffer = fileReader.result
      const data = new Uint8Array(arrayBuffer as ArrayBuffer)
      const arr = new Array()

      for (let i = 0; i !== data.length; i++) {
        arr[i] = String.fromCharCode(data[i])
      }

      const bstr = arr.join('')
      const workbook = xlsx.read(bstr, { type: 'binary', cellDates: true })
      const first_sheet_name = workbook.SheetNames[0]
      const second_sheet_name = workbook.SheetNames[1]

      if (!(second_sheet_name === 'Fonction' || second_sheet_name === 'Fonction_CA')) {
        alert("Le fichier que vous essayez d'importer n'est pas au bon format, veuillez réessayer !")
        event.target.value = ''
        return
      }

      const worksheet = workbook.Sheets[first_sheet_name]
      let firstWorksheet = xlsx.utils.sheet_to_json(worksheet, {
        blankrows: false,
      })

      // Formated data from the Excel file imported
      const importedSituation = { ...this.matchingCell(firstWorksheet, line) }

      this.displayImportLabels = true
      let situation: importedSituation = {
        index: this.indexSituation,
        ventillation: this.affectImportedSituation(importedSituation),
      }
      this.humanResourceService.importedSituation.next(situation)
      this.appService.notification(`L’import de vos données a bien été réalisé.`)
    }
    fileReader.readAsArrayBuffer(file)
  }

  /**
   * Matching des différents champs de text Excel avec fiche agent AJUST
   * @param worksheet
   * @param line
   * @returns
   */
  private matchingCell(worksheet: any, line: any) {
    const monTab = { value: [] }
    let fct = null
    let category: any = null
    let mainEtp = null
    let startDate = null
    let worksheetLine = null
    for (let i = 0; i < worksheet.length; i++) {
      worksheetLine = worksheet[i]

      if (worksheetLine['__EMPTY_1'] === 'Fonction' && worksheetLine['__EMPTY_2']) {
        const fctStr = worksheetLine['__EMPTY_2']

        fct = this.humanResourceService.fonctions.getValue().find((c: HRFonctionInterface) => c.label.toUpperCase() === fctStr?.toUpperCase()) || null
      } else if (worksheetLine['__EMPTY_1'] === 'Catégorie' && worksheetLine['__EMPTY_2']) {
        let categoryStr = worksheetLine['__EMPTY_2'].replaceAll('_', ' ')
        category =
          this.humanResourceService.categories.getValue().find((c: HRCategoryInterface) => c.label.toUpperCase() === categoryStr?.toUpperCase()) || null
      } else if (worksheetLine['__EMPTY_1'] === 'ACTIVITES EXERCEES DEPUIS LE :') {
        startDate = worksheetLine['__EMPTY_2']
        if (['(saisir ici depuis quelle date)', '', undefined].includes(startDate)) startDate = null
        else {
          startDate = new Date(startDate)
          startDate.setHours(startDate.getHours() + 5)
        }
        this.form.get('activitiesStartDate')?.setValue(startDate)
      } else if (worksheetLine['__EMPTY_1'] === 'Temps administratif de travail' && worksheetLine['__EMPTY_4']) {
        mainEtp = worksheetLine['__EMPTY_4'] as number
        mainEtp = fixDecimal(mainEtp)
      } else if (worksheetLine['__EMPTY'] && worksheetLine['__EMPTY_4']) {
        const updatedLine = {
          codeImport: worksheetLine['__EMPTY'],
          value: worksheetLine['__EMPTY_4'],
        }
        line = { ...line, ...updatedLine }
        monTab.value.push(line as never)
      }
    }

    this.importedFunction = fct?.id || null
    category !== null ? this.form.get('categoryId')?.setValue(category.id || null) : this.form.get('categoryId')?.setValue(null)
    this.form.get('etp')?.setValue(mainEtp)

    return { category, fct, mainEtp, startDate, ventilation: monTab }
  }

  /**
   * Comptage ventillation importé sous Excel
   * @param formatedData
   * @returns
   */
  affectImportedSituation(formatedData: any) {
    let result: importedVentillation[] = []
    this.sumPercentImported = 0
    formatedData.ventilation.value.map((ref: any) => {
      let found = false
      this.updatedReferentiels = this.updatedReferentiels.map((item) => {
        const re = new RegExp('[0-9]{1,2}[.]')
        const startCode = ref.codeImport.split('.')[0] + '.'
        if (re.exec(ref.codeImport) !== null && ref.codeImport == item.code_import) {
          item.percent = ref.value
          found = true
          result.push({
            referentiel: item,
            percent: item.percent,
            parentReferentiel: null,
          })

          this.sumPercentImported += item.percent || 0
          let sumSubRef = 0
          const allImported = result.map((r) => r.referentiel.code_import)
          const childs = item.childrens?.map((r) => {
            if (allImported.includes(r.code_import)) sumSubRef += r.percent || 0
            return r.code_import
          })

          if (sumSubRef !== item.percent) result = result.filter((r) => childs?.includes(r.referentiel.code_import) === false)
        } else {
          if (startCode === item.code_import && found === false) {
            item.childrens = item.childrens?.map((child) => {
              if (child.code_import === ref.codeImport) {
                child.percent = ref.value
                found = true
                result.push({
                  referentiel: child,
                  percent: child.percent,
                  parentReferentiel: item,
                })
              }
              return child
            })
          }
        }
        return item
      })
    })

    return result
  }

  /**
   * Event outfocus DropDown import de type 1
   * @param e
   */
  onclick(e: MouseEvent) {
    if (document.getElementById('drop-down')?.contains(e.target as Node)) {
      // Clicked in box
    } else {
      // Clicked outside the box
      if (this.isEdit || this.saveActions) this.toggleDropDown = false
    }
  }

  /**
   * Event outfocus DropDown import de type 2
   * @param e
   */
  onclick2(e: MouseEvent) {
    if (document.getElementById('drop-down2')?.contains(e.target as Node)) {
      // Clicked in box
    } else {
      // Clicked outside the box
      if (!this.isEdit && !this.saveActions) this.toggleDropDown = false
    }
  }

  /**
   * Remove an alert item from the list
   * @param tag
   */
  removeAlertItem(tag: string) {
    let index = -1
    index = this.humanResourceService.alertList().indexOf(tag)
    if (index !== -1) {
      this.alertSet.emit({ tag, remove: true })
    }
  }

  scrollToBottomElement() {
    this.bottomContainerTargetRef.nativeElement.scrollIntoView({
      behavior: 'smooth',
    })
  }
}
