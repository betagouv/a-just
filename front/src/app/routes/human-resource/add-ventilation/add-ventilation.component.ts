import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { sumBy } from 'lodash'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { HRCategoryService } from 'src/app/services/hr-category/hr-category.service'
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { today } from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'

/**
 * Panneau pour ajouter / modifier une situation
 * indispos, etp, category, fonction, date début
 */

@Component({
  selector: 'add-ventilation',
  templateUrl: './add-ventilation.component.html',
  styleUrls: ['./add-ventilation.component.scss'],
})
export class AddVentilationComponent extends MainClass implements OnChanges {
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
    activitiesStartDate: new FormControl(new Date(), [Validators.required]),
    etp: new FormControl<number | null>(null, [Validators.required]),
    fonctionId: new FormControl<number | null>(null, [Validators.required]),
    categoryId: new FormControl<number | null>(null, [Validators.required]),
  })

  @Input() basicData: FormGroup | null = null

  /**
   * Constructeur
   * @param hrFonctionService
   * @param hrCategoryService
   * @param humanResourceService
   */
  constructor(
    private hrFonctionService: HRFonctionService,
    private hrCategoryService: HRCategoryService,
    private humanResourceService: HumanResourceService
  ) {
    super()
  }

  /**
   * Au chargement charger les catégories et fonctions
   */
  ngOnInit() {
    this.watch(
      this.hrFonctionService.getAll().then(() => this.loadCategories())
    )
    this.watch(
      this.hrCategoryService.getAll().then((list) => (this.categories = list))
    )
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(
        () =>
          (this.allIndisponibilityReferentiel =
            this.humanResourceService.allIndisponibilityReferentiel.slice(1))
      )
    )
  }

  /**
   * Initilisation lors du changement de la date
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.lastDateStart) {
      this.onStart()
    }
  }

  /**
   * Initialisation du formulaire
   */
  onStart() {
    const situation = this.humanResourceService.findSituation(
      this.human,
      this.lastDateStart ? this.lastDateStart : undefined
    )
    this.etp = (situation && situation.etp) || 0
    this.form
      .get('activitiesStartDate')
      ?.setValue(this.lastDateStart ? new Date(this.lastDateStart) : null)
    this.form.get('etp')?.setValue(((situation && situation.etp) || 0) * 100)
    this.form
      .get('categoryId')
      ?.setValue(
        (situation && situation.category && situation.category.id) || null
      )
    this.form
      .get('fonctionId')
      ?.setValue(
        (situation && situation.fonction && situation.fonction.id) || null
      )

    this.watch(
      this.form
        .get('categoryId')
        ?.valueChanges.subscribe(() => this.loadCategories())
    )

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
      this.fonctions = (await this.hrFonctionService.getAll()).filter(
        (c) => this.form.value?.categoryId == c.categoryId
      )
    }
  }

  /**
   * Control du formulaire lors de la sauvegarde
   * @returns
   */
  async onSave() {
    if (this.indisponibilityError) {
      alert(this.indisponibilityError)
      return
    }

    const totalAffected = fixDecimal(sumBy(this.updatedReferentiels, 'percent'))
    if (totalAffected > 100) {
      alert(
        `Attention, avec les autres affectations, vous avez atteint un total de ${totalAffected}% de ventilation ! Vous ne pouvez passer au dessus de 100%.`
      )
      return
    }

    let { activitiesStartDate, categoryId, fonctionId } = this.form.value

    console.log(this.basicData)
    if (this.basicData!.controls.lastName.value === '') {
      alert('Vous devez saisir un nom pour valider la création !')
      return
    }
    if (this.basicData!.controls.firstName.value === '') {
      alert('Vous devez saisir un prénom pour valider la création !')
      return
    }

    if (!activitiesStartDate) {
      alert('Vous devez saisir une date de début de situation !')
      return
    }

    activitiesStartDate = new Date(activitiesStartDate)
    if (this.human && this.human.dateEnd && activitiesStartDate) {
      const dateEnd = new Date(this.human.dateEnd)

      // check activity date
      if (activitiesStartDate.getTime() > dateEnd.getTime()) {
        alert(
          'Vous ne pouvez pas saisir une situation postérieure à la date de départ !'
        )
        return
      }
    }

    if (this.human && this.human.dateStart && activitiesStartDate) {
      const dateStart = new Date(this.human.dateStart)

      // check activity date
      if (activitiesStartDate.getTime() < dateStart.getTime()) {
        alert(
          "Vous ne pouvez pas saisir une situation antérieure à la date d'arrivée !"
        )
        return
      }
    }

    const categories = this.humanResourceService.categories.getValue()
    const fonctions = this.humanResourceService.fonctions.getValue()
    const cat = categories.find((c) => categoryId && c.id == categoryId)
    const fonct = fonctions.find((c) => c.id == fonctionId)

    if (!cat) {
      alert('Vous devez saisir une catégorie !')
      return
    }

    if (!fonct) {
      alert('Vous devez saisir une fonction !')
      return
    }

    const situations = this.generateAllNewSituations(
      this.updatedReferentiels,
      activitiesStartDate,
      this.form.value,
      cat,
      fonct
    )

    if (this.human) {
      if (
        await this.humanResourceService.updatePersonById(this.human, {
          firstName: this.basicData!.controls.firstName.value,
          lastName: this.basicData!.controls.lastName.value,
          matricule: this.basicData!.controls.matricule.value,
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
    fonct: HRFonctionInterface
  ) {
    let situations = this.human?.situations || []
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
      return activitiesStartDate.getTime() === day.getTime()
    })

    if (isSameDate !== -1) {
      situations[isSameDate] = {
        ...situations[isSameDate],
        etp: profil.etp / 100,
        category: cat,
        fonction: fonct,
        activities,
      }
    } else {
      situations.splice(0, 0, {
        id: -1,
        etp: profil.etp / 100,
        category: cat,
        fonction: fonct,
        dateStart: activitiesStartDate,
        activities,
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
  }

  /**
   * Show panel to help
   * @param type 
   */
  openHelpPanel(type: string) {
    this.onOpenHelpPanel.emit(type)
  }
}
