import { Component, OnDestroy, OnInit, signal, ViewChild, ViewChildren, ElementRef, QueryList, WritableSignal } from '@angular/core'
import { FormControl, FormGroup, FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import _, { maxBy, minBy, orderBy } from 'lodash'
import { debounceTime } from 'rxjs'
import { AddVentilationComponent } from './add-ventilation/add-ventilation.component'
import { HRSituationInterface } from '../../interfaces/hr-situation'
import { RHActivityInterface } from '../../interfaces/rh-activity'
import { WrapperComponent } from '../../components/wrapper/wrapper.component'
import { CoverProfilDetailsComponent } from './cover-profil-details/cover-profil-details.component'
import { IndispoProfilComponent } from './indispo-profil/indispo-profil.component'
import { ActualPanelSituationComponent } from './actual-panel-situation/actual-panel-situation.component'
import { CommentProfilComponent } from './comment-profil/comment-profil.component'
import { PanelHistoryVentilationComponent } from './panel-history-ventilation/panel-history-ventilation.component'
import { ActionsInterface, PopupComponent } from '../../components/popup/popup.component'
import { DateSelectComponent } from '../../components/date-select/date-select.component'
import { MainClass } from '../../libs/main-class'
import { HRCategoryInterface } from '../../interfaces/hr-category'
import { HRFonctionInterface } from '../../interfaces/hr-fonction'
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel'
import { HumanResourceInterface } from '../../interfaces/human-resource-interface'
import { HumanResourceService } from '../../services/human-resource/human-resource.service'
import { HRFonctionService } from '../../services/hr-fonction/hr-function.service'
import { HRCategoryService } from '../../services/hr-category/hr-category.service'
import { AppService } from '../../services/app/app.service'
import { HRCommentService } from '../../services/hr-comment/hr-comment.service'
import { UserService } from '../../services/user/user.service'
import { dateAddDays, getTime, isDateBiggerThan, setTimeToMidDay, today } from '../../utils/dates'
import { copy } from '../../utils'
import { HelpButtonComponent } from '../../components/help-button/help-button.component'
import { CommonModule } from '@angular/common'
import { MatSelectModule } from '@angular/material/select'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'

/**
 * Interface d'une situation
 */
export interface HistoryInterface extends HRSituationInterface {
  /**
   * Liste des indisponibilités
   */
  indisponibilities: RHActivityInterface[]
  /**
   * Date de fin
   */
  dateStop: Date | null
  /**
   * Première situation
   */
  situationForTheFirstTime: boolean
}

/**
 * Page qui affiche en détail une fiche
 */

@Component({
  standalone: true,
  imports: [
    WrapperComponent,
    CoverProfilDetailsComponent,
    IndispoProfilComponent,
    ActualPanelSituationComponent,
    CommentProfilComponent,
    AddVentilationComponent,
    PanelHistoryVentilationComponent,
    PopupComponent,
    DateSelectComponent,
    HelpButtonComponent,
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './human-resource.page.html',
  styleUrls: ['./human-resource.page.scss'],
})
export class HumanResourcePage extends MainClass implements OnInit, OnDestroy {
  /**
   * Dom du wrapper
   */
  @ViewChild('wrapper') wrapper: WrapperComponent | undefined
  /**
   * Dom du paneau d'ajout d'une situation
   */
  @ViewChild('addDomVentilation')
  addDomVentilation: AddVentilationComponent | null = null

  /**
   *
   */
  @ViewChild(CoverProfilDetailsComponent)
  coverDetails!: CoverProfilDetailsComponent

  /**
   * Liste des catégories existantes
   */
  categories: HRCategoryInterface[] = []
  /**
   * Liste des fonctions existantes
   */
  fonctions: HRFonctionInterface[] = []
  /**
   * Référentiel
   */
  contentieuxReferentiel: ContentieuReferentielInterface[] = []
  /**
   * Fiche
   */
  currentHR: HumanResourceInterface | null = null
  /**
   * Retour sur la catégorie
   */
  categoryName: string = ''
  /**
   * Liste de toutes les situations
   */
  histories: HistoryInterface[] = []
  /**
   * Situations passé à aujourd'hui
   */
  historiesOfThePast: HistoryInterface[] = []
  /**
   * Situations futur à aujourd'hui
   */
  historiesOfTheFutur: HistoryInterface[] = []
  /**
   * Liste de toutes les indispo de la fiche
   */
  allIndisponibilities: RHActivityInterface[] = []
  /**
   * Mode d'édition courant
   */
  onEditIndex: number | null = null // null (no edition), -1 (new edition), x (x'eme edition)
  /**
   * Indispo en court d'édition
   */
  updateIndisponiblity: RHActivityInterface | null = null
  /**
   * Référentiel des indispo
   */
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = []
  /**
   * Référentiel des indispo groupedByCategory
   */
  groupedIndispo: any[] = []
  /**
   * Indispos en error (chevauchement de date ou plus de 100%)
   */
  indisponibilityError: string | null = null
  /**
   * Première date de situation
   */
  actualHistoryDateStart: Date | null = null
  /**
   * Derniere date de situation
   */
  actualHistoryDateStop: Date | null = null
  /**
   * Index de la situation en cour d'édition
   */
  indexOfTheFuture: number | null = null
  /**
   * Variable en cours d'export de page
   */
  duringPrint: boolean = false
  /**
   * Get Link to back
   */
  routerLinkToGoBack: string[] = ['/']
  /**
   * Formulaire de saisie
   */
  basicHrInfo = new FormGroup({
    lastName: new FormControl(''),
    firstName: new FormControl(''),
    matricule: new FormControl(''),
  })
  /**
   * showActuelPanel
   */
  showActuelPanel: boolean = false
  /**
   * Initial etp
   */
  initialETP: number | null = null
  /**
   * Current etp
   */
  currentETP: WritableSignal<number | null> = signal(null)
  /**
   * Liste des alertes à afficher
   */
  alertList: string[] = []

  hasInitCalendars = false
  hasInitInputs = false
  calendarsOpened: number[] = []

  /**
   * Constructeur
   * @param humanResourceService
   * @param route
   * @param router
   * @param hrFonctionService
   * @param hrCategoryService
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private route: ActivatedRoute,
    private router: Router,
    private hrFonctionService: HRFonctionService,
    private hrCategoryService: HRCategoryService,
    public appService: AppService,
    private hrCommentService: HRCommentService,
    private userService: UserService,
  ) {
    super()

    this.basicHrInfo.valueChanges.pipe(debounceTime(500)).subscribe((v) => {
      if (this.currentHR && this.onEditIndex === null) {
        let options = {}

        if (v.firstName !== (this.currentHR.firstName || '')) {
          options = { ...options, firstName: v.firstName }
        }
        if (v.lastName !== (this.currentHR.lastName || '')) {
          options = { ...options, lastName: v.lastName }
        }
        if (v.matricule !== (this.currentHR.matricule || '')) {
          options = { ...options, matricule: v.matricule }
        }

        if (Object.keys(options).length) {
          // @ts-ignore
          if (options.lastName === '' || options.lastName === 'Nom') {
            setTimeout(() => {
              alert('Vous devez saisir un nom pour valider la création !')
            }, 1500)
            return
          }
          // @ts-ignore
          if (options.firstName === '' || options.firstName === 'Prénom') {
            setTimeout(() => {
              alert('Vous devez saisir un prénom pour valider la création !')
            }, 1500)
            return
          }

          this.humanResourceService.updatePersonById(this.currentHR, options)
          this.currentHR = {
            ...this.currentHR,
            ...options,
          }
        }
      }
    })
  }

  /**
   * Au chargement récupération des variables globales + chargement
   */
  ngOnInit() {
    this.watch(
      this.route.params.subscribe((params) => {
        if (params['id']) {
          this.onLoad()
        }
      }),
    )
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((list) => {
        this.contentieuxReferentiel = list
        this.allIndisponibilityReferentiel = this.humanResourceService.allIndisponibilityReferentiel.slice(1)
        this.groupedIndispo = this.groupIndispoByCategory()
      }),
    )

    this.hrFonctionService.getAll().then((list) => {
      this.fonctions = list
      this.onLoad()
    })
    this.hrCategoryService.getAll().then((list) => {
      this.categories = list
      this.onLoad()
    })
  }

  ngAfterViewInit() {
    this.routerLinkToGoBack = this.appService.previousUrl ? [this.appService.previousUrl] : ['/']
  }

  ngAfterViewChecked() {
    if (!this.hasInitCalendars && !this.hasInitInputs && this.coverDetails) {
      this.hasInitCalendars = true
      this.hasInitInputs = true
    }
  }

  /**
   * A la destruction suppression des observables
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Chargement de la fiche coté back + traitement
   * @param cacheHr
   * @returns
   */
  async onLoad(cacheHr: HumanResourceInterface | null = null, updated = true) {
    if (this.categories.length === 0 || this.fonctions.length === 0) {
      return
    }

    let findUser = null
    if (cacheHr) {
      findUser = cacheHr
    } else {
      const id = +this.route.snapshot.params['id']
      findUser = await this.humanResourceService.loadRemoteHR(id)
    }
    console.log('userFinded', findUser)
    if (findUser) {
      this.currentHR = findUser

      if (updated) {
        this.basicHrInfo.get('firstName')?.setValue(findUser.firstName || '')
        this.basicHrInfo.get('lastName')?.setValue(findUser.lastName || '')
        this.basicHrInfo.get('matricule')?.setValue(findUser.matricule || '')
      }

      // control indisponibilities
      this.indisponibilityError = this.humanResourceService.controlIndisponibilities(this.currentHR, this.currentHR?.indisponibilities || [])
      // console.log(findUser, { indisponibilityError: this.indisponibilityError })

      const currentSituation = this.humanResourceService.findSituation(this.currentHR)
      if (currentSituation && currentSituation.category) {
        const findCategory = this.categories.find(
          // @ts-ignore
          (c) => c.id === currentSituation.category.id,
        )
        this.categoryName = findCategory ? findCategory.label.toLowerCase() : ''
      } else {
        this.categoryName = ''
      }
    } else {
      this.currentHR = null
      this.categoryName = ''
    }

    this.formatHRHistory()
  }

  /**
   * Génération des situations artificielle ou non
   */
  formatHRHistory() {
    if (this.fonctions.length === 0 || !this.currentHR || this.onEditIndex !== null) {
      return
    }

    // if no situation and createdAt is more than 6 hours ago
    if (this.currentHR.situations.length === 0 && this.currentHR.createdAt && getTime() - getTime(this.currentHR.createdAt) > 6 * 60 * 60 * 1000) {
      this.onEditIndex = null
      return
    }

    this.histories = []
    this.historiesOfThePast = []
    this.historiesOfTheFutur = []

    this.allIndisponibilities = this.currentHR.indisponibilities || []
    const situations = orderBy(this.currentHR.situations || [], [
      function (o: HRSituationInterface) {
        const date = new Date(o.dateStart)
        return date.getTime()
      },
    ])

    if (situations.length === 0) {
      this.onEditIndex = -1
      return
    }

    let listAllDates = []
    let currentDateEnd
    if (this.currentHR.dateStart) {
      listAllDates.push(today(this.currentHR.dateStart))
    }
    if (this.currentHR.dateEnd) {
      currentDateEnd = today(this.currentHR.dateEnd)
      listAllDates.push(currentDateEnd)
    }
    listAllDates = listAllDates.concat(situations.filter((s) => s.dateStart).map((s) => today(s.dateStart)))
    listAllDates = listAllDates.concat(this.allIndisponibilities.filter((i) => i.dateStart).map((s) => today(s.dateStart)))
    listAllDates = listAllDates.concat(this.allIndisponibilities.filter((i) => i.dateStop).map((s) => today(s.dateStop)))
    // console.log(listAllDates)

    const minDate = minBy(listAllDates, (d) => d.getTime())
    let maxDate = maxBy(listAllDates, (d) => d.getTime())

    if (!minDate || !maxDate) {
      this.onEditIndex = -1
      return
    }

    // if not date end force to create a situation after the last one
    if (!currentDateEnd && this.currentHR && this.currentHR.indisponibilities && this.currentHR.indisponibilities.length) {
      maxDate = today(maxDate) // stop reference
      maxDate.setDate(maxDate.getDate() + 1)
    }

    // console.log(minDate, maxDate)

    const currentDate = new Date(minDate)
    let idsDetected: number[] = []
    let lastSituationId = null

    while (currentDate.getTime() <= maxDate.getTime()) {
      let delta: number[] = []
      const findIndispos = this.humanResourceService.findAllIndisponibilities(this.currentHR, currentDate)
      const findSituation = this.humanResourceService.findSituation(this.currentHR, currentDate)

      delta = findIndispos.map((f) => f.id)
      if (findSituation) {
        delta.push(findSituation.id)
      }

      if (JSON.stringify(idsDetected) !== JSON.stringify(delta)) {
        if (lastSituationId && delta.indexOf(lastSituationId) === -1 && this.histories.length) {
          this.histories[this.histories.length - 1].situationForTheFirstTime = true
        }

        lastSituationId = (findSituation && findSituation.id) || null
        idsDetected = delta
        let etp = (findSituation && findSituation.etp) || 0

        if (currentDateEnd && currentDateEnd.getTime() <= currentDate.getTime()) {
          etp = 0
        }

        let id = (findSituation && findSituation.id) || -1
        if (this.histories.find((h) => h.id === id)) {
          id = -1
        }

        // add stop date
        if (this.histories.length) {
          this.histories[this.histories.length - 1].dateStop = dateAddDays(currentDate, -1)
        }

        // new list
        this.histories.push({
          id,
          category: (findSituation && findSituation.category) || null,
          fonction: (findSituation && findSituation.fonction) || null,
          etp,
          indisponibilities: findIndispos,
          activities: (findSituation && findSituation.activities) || [],
          dateStart: today(currentDate),
          dateStop: null,
          situationForTheFirstTime:
            (id !== -1 && this.histories.length === 0) || (this.histories.length && this.histories[this.histories.length - 1].id !== id) ? true : false,
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (
      this.histories.length &&
      currentDateEnd &&
      !this.histories[this.histories.length - 1].dateStop &&
      this.histories[this.histories.length - 1].dateStart.getTime() < currentDateEnd.getTime()
    ) {
      this.histories[this.histories.length - 1].dateStop = currentDateEnd
    }

    // add stituation if date start if lower than first situation
    if (this.histories.length && this.currentHR.dateStart && this.histories[0].dateStart.getTime() > today(this.currentHR.dateStart).getTime()) {
      const firstSituationExistant = this.histories.find((h) => h.category)
      this.histories.splice(0, 0, {
        id: -1,
        category: firstSituationExistant ? firstSituationExistant.category : null,
        fonction: firstSituationExistant ? firstSituationExistant.fonction : null,
        etp: null,
        indisponibilities: [],
        activities: [],
        dateStart: today(this.currentHR.dateStart),
        dateStop: dateAddDays(this.histories[0].dateStart, -1),
        situationForTheFirstTime: false,
      })
    }

    this.histories = this.histories.reverse() // reverse array to html render
    this.historiesOfThePast = this.histories.filter((a) => a.dateStop && a.dateStop.getTime() < today().getTime())
    this.historiesOfTheFutur = this.histories.filter((a) => a.dateStart && a.dateStart.getTime() > today().getTime())

    // find the actuel index of situation
    this.indexOfTheFuture = null
    this.histories.map((h, index) => {
      const dateStart = h.dateStart ? h.dateStart : null
      const dateStop = h.dateStop ? h.dateStop : null

      if (((dateStart && dateStart.getTime() <= today().getTime()) || !dateStart) && ((dateStop && dateStop.getTime() >= today().getTime()) || !dateStop)) {
        this.indexOfTheFuture = index
        this.currentETP.set(h.etp)
        this.initialETP = this.currentETP()
      }
    })

    this.actualHistoryDateStart = null
    this.actualHistoryDateStop = null
    if (this.indexOfTheFuture === null) {
      // check if past or the future
      if (this.histories.length) {
        if (this.histories[this.histories.length - 1].dateStart.getTime() > today().getTime()) {
          this.actualHistoryDateStop = this.histories[this.histories.length - 1].dateStart
        } else if (this.histories[0].dateStop && this.histories[0].dateStop.getTime() < today().getTime()) {
          const dateStop = new Date(this.histories[0].dateStop)
          dateStop.setDate(dateStop.getDate() + 1)
          this.actualHistoryDateStart = dateStop
        }
      }
    } else {
      this.actualHistoryDateStart = this.histories[this.indexOfTheFuture].dateStart
      this.actualHistoryDateStop = this.histories[this.indexOfTheFuture].dateStop
    }

    /* console.log({
      indexOfTheFuture: this.indexOfTheFuture,
      histories: this.histories,
      actualHistoryDateStart: this.actualHistoryDateStart,
      actualHistoryDateStop: this.actualHistoryDateStop,
    }) */

    if (this.actualHistoryDateStart && this.currentHR.dateEnd && isDateBiggerThan(this.actualHistoryDateStart, this.currentHR.dateEnd)) {
      this.showActuelPanel = false
    } else if (
      !this.actualHistoryDateStart &&
      this.actualHistoryDateStop &&
      this.currentHR.dateStart &&
      isDateBiggerThan(this.currentHR.dateStart, this.actualHistoryDateStop)
    ) {
      this.showActuelPanel = false
    } else {
      this.showActuelPanel = true
    }

    this.preOpenSituation()
  }

  /**
   * Amélioration du chargement de la liste
   * @param index
   * @param item
   * @returns
   */
  trackByDate(index: number, item: any) {
    return item.dateStart
  }

  /**
   * Demande de suppression del a fiche
   */
  async onDelete() {
    if (this.currentHR) {
      if (await this.humanResourceService.removeHrById(this.currentHR.id)) {
        this.router.navigate(['/ventilations'])
      }
    }
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

      this.currentHR = {
        ...this.currentHR,
        [nodeName]: value,
      }

      this.onLoad(
        await this.humanResourceService.updatePersonById(this.currentHR, {
          [nodeName]: value,
        }),
        false,
      )

      /* console.log({
        [nodeName]: value,
      }) */
    }
  }

  /**
   * Fermeture du paneau d'une situation
   * @param removeIndispo
   */
  async onCancel(removeIndispo: boolean = false) {
    if (removeIndispo && this.currentHR && this.currentHR.indisponibilities.length) {
      await this.updateHuman('indisponibilities', [])
    }

    console.log('on cancel')

    this.onEditIndex = null

    const findElement = document.getElementById('content')
    if (findElement) {
      findElement.scrollTo({
        behavior: 'smooth',
        top: 0,
      })
    }

    this.formatHRHistory()

    if (this.histories.length === 0) {
      this.onEditIndex = null
    }
  }

  /**
   * Demande de sauvegarde de la situation
   */
  onSave() {
    if (this.addDomVentilation) {
      this.addDomVentilation.onSave()
    }
  }

  /**
   * Demande de chargement de la fiche
   */
  onNewUpdate() {
    this.onEditIndex = null
    this.onLoad(null, false)
  }

  /**
   * Demande d'ajout d'une indispo
   * @param indispo
   */
  onAddIndispiniblity(indispo: RHActivityInterface | null = null) {
    this.updateIndisponiblity = indispo
      ? copy(indispo)
      : {
          id: this.allIndisponibilities.length * -1 - 1,
          percent: 0,
          contentieux: {
            ...this.allIndisponibilityReferentiel[0],
          },
          dateStart: null,
        }
  }

  /**
   * Creation, modification et de suppression des indispo
   * @param action
   * @returns
   */
  async onEditIndisponibility(action: ActionsInterface) {
    const controlIndisponibilitiesError = true // alway //this.onEditIndex === null; // if panel ediction do not control error

    switch (action.id) {
      case 'close':
        {
          this.updateIndisponiblity = null
        }
        break
      case 'modify':
        {
          if (this.updateIndisponiblity && !this.updateIndisponiblity.dateStart) {
            alert("Vous devez saisir une date de début d'indisponibilité !")
            return false
          }

          if (this.updateIndisponiblity && !this.updateIndisponiblity.percent) {
            alert("Vous devez saisir un temps d'indisponibilité !")
            return false
          }

          if (this.updateIndisponiblity && this.updateIndisponiblity.percent && this.updateIndisponiblity.percent > 100) {
            alert("Vous ne pouvez pas saisir plus de 100% d'indisponibilité !")
            return false
          }

          if (this.updateIndisponiblity && !this.updateIndisponiblity.dateStart) {
            alert("Vous devez saisir une date de départ d'indisponibilité !")
            return false
          }

          if (this.updateIndisponiblity && !this.allIndisponibilityReferentiel.find((i) => i.id == this.updateIndisponiblity?.contentieux.id)) {
            alert("Vous devez saisir un type d'indisponibilité !")
            return false
          }

          // control date start
          if (this.currentHR && this.currentHR.dateStart) {
            const hrDateStart = today(this.currentHR.dateStart)

            if (this.updateIndisponiblity && this.updateIndisponiblity.dateStart) {
              const indispDateStart = today(this.updateIndisponiblity.dateStart)
              if (hrDateStart.getTime() > indispDateStart.getTime()) {
                alert("Vous ne pouvez pas saisir une date de début d'indisponibilité antérieure à la date d'arrivée !")
                return false
              }
            }

            if (this.updateIndisponiblity && this.updateIndisponiblity.dateStop) {
              const indispDateStop = new Date(this.updateIndisponiblity.dateStop)
              if (hrDateStart.getTime() > indispDateStop.getTime()) {
                alert("Vous ne pouvez pas saisir une date de fin d'indisponibilités antérieure à la date d'arrivée !")
                return false
              }
            }
          }

          // control date stop
          if (this.currentHR && this.currentHR.dateEnd) {
            let hrDateStop = new Date(this.currentHR.dateEnd)
            hrDateStop = setTimeToMidDay(hrDateStop) || hrDateStop

            if (this.updateIndisponiblity && this.updateIndisponiblity.dateStart) {
              const indispDateStart = new Date(this.updateIndisponiblity.dateStart)
              if (hrDateStop.getTime() < indispDateStart.getTime()) {
                alert("Vous ne pouvez pas saisir une date de début d'indisponibilité postérieure à la date de départ !")
                return false
              }
            }

            if (this.updateIndisponiblity && this.updateIndisponiblity.dateStop) {
              const indispDateStop = new Date(this.updateIndisponiblity.dateStop)
              if (hrDateStop.getTime() < indispDateStop.getTime()) {
                alert("Vous ne pouvez pas saisir une date de fin d'indisponibilité postérieure à la date de départ !")
                return false
              }
            }
          }

          // control date start and date stop
          if (this.updateIndisponiblity && this.updateIndisponiblity.dateStart && this.updateIndisponiblity.dateStop) {
            const indispDateStart = new Date(this.updateIndisponiblity.dateStart)
            const indispDateStop = new Date(this.updateIndisponiblity.dateStop)
            if (indispDateStart.getTime() > indispDateStop.getTime()) {
              alert('Vous ne pouvez pas saisir une date de début postérieure à la date de fin !')
              return false
            }
          }

          if (this.updateIndisponiblity) {
            // force id to int with selector
            this.updateIndisponiblity.contentieux.id = +this.updateIndisponiblity.contentieux.id

            const index = this.allIndisponibilities.findIndex((i) => i.id === this.updateIndisponiblity?.id)
            const contentieux = this.allIndisponibilityReferentiel.find((c) => c.id === this.updateIndisponiblity?.contentieux.id)

            if (!contentieux) {
              alert("Il y a un problème avec l'indisponibilitiés choisie.")
              return false
            }

            const cacheOldIndispo = [...this.allIndisponibilities]
            if (index !== -1) {
              cacheOldIndispo[index] = {
                ...this.allIndisponibilities[index],
                ...this.updateIndisponiblity,
                contentieux,
              }
            } else if (this.updateIndisponiblity) {
              cacheOldIndispo.push({
                ...this.updateIndisponiblity,
                contentieux,
              })
            }
            if (this.currentHR) {
              this.indisponibilityError = this.humanResourceService.controlIndisponibilities(this.currentHR, cacheOldIndispo)
              if (controlIndisponibilitiesError && this.indisponibilityError) {
                const errorToShow = this.indisponibilityError
                this.indisponibilityError = null // only control by alert
                alert(errorToShow)
                return false
              } else {
                this.updateIndisponiblity = null
                this.allIndisponibilities = [...cacheOldIndispo]
              }

              if (!this.indisponibilityError) {
                await this.updateHuman('indisponibilities', this.allIndisponibilities)
              }
            } else {
              this.updateIndisponiblity = null
            }
          }
        }
        break
      case 'delete':
        {
          const index = this.allIndisponibilities.findIndex((i) => i.id === ((this.updateIndisponiblity && this.updateIndisponiblity.id) || ''))
          if (index !== -1) {
            this.allIndisponibilities.splice(index, 1)
            if (this.currentHR) {
              this.indisponibilityError = this.humanResourceService.controlIndisponibilities(this.currentHR, this.allIndisponibilities)

              if (!this.indisponibilityError) {
                await this.updateHuman('indisponibilities', this.allIndisponibilities)
              }
            }
          }
          this.updateIndisponiblity = null
        }
        break
    }

    return true
  }

  /**
   * Demande de modification d'une situation
   * @param history
   */
  onSelectSituationToEdit(history: HistoryInterface | null = null) {
    console.log(history, this.histories)

    const index = history ? this.histories.findIndex((h) => h.id === history.id && h.dateStart === history.dateStart) : -1
    console.log('index', index)

    if (this.onEditIndex === null) {
      if (index === -1) {
        // add situation
        this.onEditIndex = -1
      } else {
        // edit situation
        this.onEditIndex = index
      }
    } else {
      alert('Vous ne pouvez pas modifier plusieurs situations en même temps !')
    }

    if (this.currentHR) {
      // force to control indisponibilities
      this.indisponibilityError = this.humanResourceService.controlIndisponibilities(this.currentHR, this.currentHR.indisponibilities)
      // console.log({ indisponibilityError: this.indisponibilityError })
    }
  }

  /**
   * Demande de suppression d'une situation
   * @param id
   */
  async onRemoveSituation(id: number) {
    const callback = async (forceAlert = true) => {
      const returnValue = await this.humanResourceService.removeSituation(id, forceAlert)
      this.onEditIndex = null

      // Remove all indispo
      if (this.currentHR && returnValue) {
        this.currentHR.situations = returnValue.situations
        if (returnValue && returnValue.situations.length === 0 && this.currentHR) {
          await this.updateHuman('indisponibilities', [])
          this.allIndisponibilities = []
        }
      }

      // console.log(returnValue, this.histories.length, this.onEditIndex)
      if (returnValue) {
        // force to not show on boarding after delete last situation
        this.onLoad(returnValue)
      }

      if (this.histories.length === 0) {
        this.onEditIndex = null
      }
    }

    if (this.currentHR && this.currentHR.situations.length === 1) {
      this.appService.alert.next({
        title: 'Attention : ',
        text: `La suppression de cette situation entraînera la suppression de la fiche agent et cette opération sera irréversible.<br/><br/>Si l'agent a quitté la juridiction, nous vous invitons à renseigner une date de départ.<br/><br/>S’il fait toujours partie de vos effectifs, vous pouvez corriger ou conserver cette situation en l'état.`,
        secondaryText: 'Conserver cette fiche',
        callbackSecondary: () => {},
        okText: 'Supprimer cette fiche',
        callback: () => {
          callback(false)
        },
      })
    } else {
      callback(true)
    }
  }

  /**
   * Demande d'extraction de la page au format pdf
   */
  onExport() {
    this.hrCommentService.forceOpenAll.next(true)
    const parent = document.getElementById('first-panel')
    const child = document.getElementById('comment-profil')
    const parent2 = document.getElementById('wrapper-printed')
    parent?.removeChild(child as Node)
    parent2?.appendChild(child as Node)

    const reduire1 = document.getElementById('logo-2')
    const reduire2 = document.getElementById('logo-4')

    const details = document.getElementById('second-row')

    details?.classList.add('size')
    reduire1?.classList.add('hide')
    reduire2?.classList.add('hide')

    this.duringPrint = true
    this.wrapper
      ?.exportAsPdf(
        `Fiche individuelle${this.currentHR ? ' de ' + this.currentHR.firstName + ' ' + this.currentHR.lastName : ''} en date du ${new Date()
          .toJSON()
          .slice(0, 10)}.pdf`,
      )
      .then(() => {
        details?.classList.remove('size')
        reduire1?.classList.remove('hide')
        reduire2?.classList.remove('hide')
        this.hrCommentService.forceOpenAll.next(false)
        this.duringPrint = false
        parent2?.removeChild(child as Node)
        parent?.appendChild(child as Node)
      })
  }

  /**
   * Enlever le focus du champ d'édition
   * @param event mouse event
   */
  blur(event: any) {
    event.target.blur()
  }

  /**
   * Force to open help panel
   * @param type
   */
  openHelpPanel(type: string | undefined) {
    switch (type) {
      case 'indispo':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Ajouter des indisponibilités',
          path: this.userService.isCa()
            ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/renseigner-les-indisponibilites'
            : 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/ventilateur/ajouter-des-indisponibilites',
          subTitle: "Qu'est-ce que c'est ?",
          printSubTitle: true,
        })
        break
      case 'nouvelle-situation':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Enregistrer une nouvelle situation',
          path: this.userService.isCa()
            ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/creer-ou-modifier-une-fiche/enregistrer-une-nouvelle-situation'
            : 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/ventilateur/creer-ou-modifier-une-fiche/enregistrer-une-nouvelle-situation',
          subTitle: "Qu'est-ce que c'est ?",
          printSubTitle: true,
        })
        break
      case 'fix-fiche':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Corriger une fiche préexistante',
          path: this.userService.isCa()
            ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/creer-ou-modifier-une-fiche/corriger-une-fiche-preexistante'
            : 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/ventilateur/creer-ou-modifier-une-fiche/corriger-une-fiche-preexistante',
          subTitle: "Qu'est-ce que c'est ?",
          printSubTitle: true,
        })
        break
      case 'add-fiche':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Créer ou modifier une fiche',
          path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/ventilateur/creer-ou-modifier-une-fiche',
          subTitle: "Qu'est-ce que c'est ?",
          printSubTitle: true,
        })
        break
      default:
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Fiche individuelle :',
          path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/ventilateur/enregistrer-une-nouvelle-situation',
          printSubTitle: true,
        })
    }
  }

  /**
   * Open panel
   */
  preOpenSituation() {
    const findIndex = this.histories.findIndex((h) => h.etp === this.ETP_NEED_TO_BE_UPDATED)

    if (findIndex !== -1) {
      this.onSelectSituationToEdit(this.histories[findIndex])
    }
  }

  /**
   * Fonction de mise à jours de l'etp courant pour la création d'un nouvel agent uniquement
   * @param etp
   */
  updateETP(etp: number | null) {
    if (!this.initialETP) {
      this.currentETP.set(etp)
    }
  }
  groupIndispoByCategory(): any {
    const grouped = _.groupBy(this.allIndisponibilityReferentiel, (indispo) => indispo.category)
    return grouped
  }

  setToMidDay(elem: Date) {
    return setTimeToMidDay(elem)
  }

  /**
   * Fonction de mise à jour des alertes
   * @param updatedList
   */
  onAlertsUpdated({ updatedList, index }: { updatedList?: string[]; index?: number }) {
    if (updatedList !== undefined) {
      this.alertList = updatedList

      // Scroll to the "Start Date" selector if it's the last element to complete.
      // This ensures all users can see the element regardless of their screen size, and avoids manual scrolling.
      if (this.alertList.length > 0) {
        if (this.alertList.includes('activitiesStartDate')) {
          if (this.addDomVentilation) this.addDomVentilation.scrollToBottomElement()
        } else if (this.alertList.includes('etp')) {
          this.scrollTo('etpForm', document.getElementsByClassName('wrapper-content')[0], 250)
        }
      }
    }
    if (index !== undefined) {
      this.alertList.splice(index, 1)
    }
  }

  /**
   * Permet à l'utilisateur de passer d'un input à un autre avec la touche "Entrée"
   * @param event
   */
  focusNext({ event, calendarType }: { event: any; calendarType: string | null }) {
    // if (event.key === 'Tab') {
    //   event.preventDefault();
    // }
    // console.log('here');
    if ((event && event.key === 'Enter') /*|| event.key === 'Tab'*/ || calendarType) {
      const inputsArray = this.coverDetails.getInputs()
      if (!calendarType && event.target.id !== 'matricule') {
        event.preventDefault()
        const currentIndex = inputsArray.findIndex((input: ElementRef) => input.nativeElement === event.target)
        if (currentIndex > -1 && currentIndex < inputsArray.length - 1) {
          inputsArray[currentIndex + 1].nativeElement.focus()
        }
      } else {
        inputsArray.map((elem: ElementRef) => elem.nativeElement.blur())

        if (this.coverDetails) {
          const calendars = this.coverDetails.getCalendars()
          console.log('calendars', calendarType)
          if (event && event.target.id === 'matricule') {
            calendars[0].onClick()
          } else if (calendarType && calendarType === 'dateStart') {
            calendars[1].onClick()
          }
        }
      }
    }
  }
}
