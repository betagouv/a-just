import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { maxBy, minBy, orderBy, sumBy } from 'lodash'
import { debounceTime, delay, last, mergeMap, of, takeLast } from 'rxjs'
import { ActionsInterface } from 'src/app/components/popup/popup.component'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { DocumentationInterface } from 'src/app/interfaces/documentation'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HRSituationInterface } from 'src/app/interfaces/hr-situation'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { AppService } from 'src/app/services/app/app.service'
import { HRCategoryService } from 'src/app/services/hr-category/hr-category.service'
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { copy } from 'src/app/utils'
import { dateAddDays, today } from 'src/app/utils/dates'
import { AddVentilationComponent } from './add-ventilation/add-ventilation.component'

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
   * Documentation patch
   */
  documentation: DocumentationInterface = {
    title: 'Fiche individuelle :',
    path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/ventilateur/enregistrer-une-nouvelle-situation',
  }
  /**
   * Variable en cours d'export de page
   */
  duringPrint: boolean = false
  /**
   * Formulaire de saisie
   */
  basicHrInfo = new FormGroup({
    lastName: new FormControl(''),
    firstName: new FormControl(''),
    matricule: new FormControl(''),
  })

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
    private appService: AppService
  ) {
    super()

    this.basicHrInfo.valueChanges.pipe(debounceTime(500)).subscribe((v) => {
      if (this.currentHR && this.onEditIndex === null) {
        let options = {}

        if (v.firstName !== (this.currentHR.firstName || '')) {
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
          if (options.lastName === '' || options.lastName === 'Nom') {
            alert('Vous devez saisir un nom pour valider la création !')
            return
          }
          // @ts-ignore
          if (options.firstName === '' || options.firstName === 'Prénom') {
            alert('Vous devez saisir un prénom pour valider la création !')
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
        if (params.id) {
          this.onLoad()
        }
      })
    )
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((list) => {
        this.contentieuxReferentiel = list
        this.allIndisponibilityReferentiel =
          this.humanResourceService.allIndisponibilityReferentiel.slice(1)
      })
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

    this.currentHR = null

    let findUser
    if (cacheHr) {
      findUser = cacheHr
    } else {
      const id = +this.route.snapshot.params.id
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
      this.indisponibilityError =
        this.humanResourceService.controlIndisponibilities(
          this.currentHR,
          this.currentHR.indisponibilities
        )
      console.log(findUser, { indisponibilityError: this.indisponibilityError })

      const currentSituation = this.humanResourceService.findSituation(
        this.currentHR
      )
      if (currentSituation && currentSituation.category) {
        const findCategory = this.categories.find(
          // @ts-ignore
          (c) => c.id === currentSituation.category.id
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
    if (this.fonctions.length === 0 || !this.currentHR) {
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
    listAllDates = listAllDates.concat(
      situations.filter((s) => s.dateStart).map((s) => today(s.dateStart))
    )
    listAllDates = listAllDates.concat(
      this.allIndisponibilities
        .filter((i) => i.dateStart)
        .map((s) => today(s.dateStart))
    )
    listAllDates = listAllDates.concat(
      this.allIndisponibilities
        .filter((i) => i.dateStop)
        .map((s) => today(s.dateStop))
    )
    console.log(listAllDates)

    const minDate = minBy(listAllDates, (d) => d.getTime())
    let maxDate = maxBy(listAllDates, (d) => d.getTime())

    if (!minDate || !maxDate) {
      this.onEditIndex = -1
      return
    }

    // if not date end force to create a situation after the last one
    if (
      !currentDateEnd &&
      this.currentHR &&
      this.currentHR.indisponibilities &&
      this.currentHR.indisponibilities.length
    ) {
      maxDate = today(maxDate) // stop reference
      maxDate.setDate(maxDate.getDate() + 1)
    }

    console.log(minDate, maxDate)

    const currentDate = new Date(minDate)
    let idsDetected: number[] = []
    let lastSituationId = null

    while (currentDate.getTime() <= maxDate.getTime()) {
      let delta: number[] = []
      const findIndispos = this.humanResourceService.findAllIndisponibilities(
        this.currentHR,
        currentDate
      )
      const findSituation = this.humanResourceService.findSituation(
        this.currentHR,
        currentDate
      )

      delta = findIndispos.map((f) => f.id)
      if (findSituation) {
        delta.push(findSituation.id)
      }

      if (JSON.stringify(idsDetected) !== JSON.stringify(delta)) {
        if (
          lastSituationId &&
          delta.indexOf(lastSituationId) === -1 &&
          this.histories.length
        ) {
          this.histories[this.histories.length - 1].situationForTheFirstTime =
            true
        }

        lastSituationId = (findSituation && findSituation.id) || null
        idsDetected = delta
        let etp = (findSituation && findSituation.etp) || 0

        if (
          currentDateEnd &&
          currentDateEnd.getTime() <= currentDate.getTime()
        ) {
          etp = 0
        }

        const id = (findSituation && findSituation.id) || -1

        // add stop date
        if (this.histories.length) {
          this.histories[this.histories.length - 1].dateStop = dateAddDays(
            currentDate,
            -1
          )
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
            (id !== -1 && this.histories.length === 0) ||
            (this.histories.length &&
              this.histories[this.histories.length - 1].id !== id)
              ? true
              : false,
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (
      this.histories.length &&
      currentDateEnd &&
      !this.histories[this.histories.length - 1].dateStop &&
      this.histories[this.histories.length - 1].dateStart.getTime() <
        currentDateEnd.getTime()
    ) {
      this.histories[this.histories.length - 1].dateStop = currentDateEnd
    }

    // add stituation if date start if lower than first situation
    if (
      this.histories.length &&
      this.currentHR.dateStart &&
      this.histories[0].dateStart.getTime() >
        today(this.currentHR.dateStart).getTime()
    ) {
      const firstSituationExistant = this.histories.find((h) => h.category)
      this.histories.splice(0, 0, {
        id: -1,
        category: firstSituationExistant
          ? firstSituationExistant.category
          : null,
        fonction: firstSituationExistant
          ? firstSituationExistant.fonction
          : null,
        etp: 1,
        indisponibilities: [],
        activities: [],
        dateStart: today(this.currentHR.dateStart),
        dateStop: dateAddDays(this.histories[0].dateStart, -1),
        situationForTheFirstTime: false,
      })
    }

    this.histories = this.histories.reverse() // reverse array to html render
    this.historiesOfThePast = this.histories.filter(
      (a) => a.dateStop && a.dateStop.getTime() < today().getTime()
    )
    this.historiesOfTheFutur = this.histories.filter(
      (a) => a.dateStart && a.dateStart.getTime() >= today().getTime()
    )

    // find the actuel index of situation
    this.indexOfTheFuture = null
    this.histories.map((h, index) => {
      const dateStart = h.dateStart ? h.dateStart : null
      const dateStop = h.dateStop ? h.dateStop : null

      if (
        ((dateStart && dateStart.getTime() <= today().getTime()) ||
          !dateStart) &&
        ((dateStop && dateStop.getTime() >= today().getTime()) || !dateStop)
      ) {
        this.indexOfTheFuture = index
      }
    })

    this.actualHistoryDateStart = null
    this.actualHistoryDateStop = null
    if (this.indexOfTheFuture === null) {
      // check if past or the future
      if (this.histories.length) {
        if (
          this.histories[this.histories.length - 1].dateStart.getTime() >
          today().getTime()
        ) {
          this.actualHistoryDateStop =
            this.histories[this.histories.length - 1].dateStart
        } else if (
          this.histories[0].dateStop &&
          this.histories[0].dateStop.getTime() < today().getTime()
        ) {
          const dateStop = new Date(this.histories[0].dateStop)
          dateStop.setDate(dateStop.getDate() + 1)
          this.actualHistoryDateStart = dateStop
        }
      }
    } else {
      this.actualHistoryDateStart =
        this.histories[this.indexOfTheFuture].dateStart
      this.actualHistoryDateStop =
        this.histories[this.indexOfTheFuture].dateStop
    }

    console.log({
      indexOfTheFuture: this.indexOfTheFuture,
      histories: this.histories,
      actualHistoryDateStart: this.actualHistoryDateStart,
      actualHistoryDateStop: this.actualHistoryDateStop,
    })
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

      this.onLoad(
        await this.humanResourceService.updatePersonById(this.currentHR, {
          [nodeName]: value,
        }),false
      )

      this.currentHR = {
        ...this.currentHR,
        [nodeName]: value,
      }

      console.log({
        [nodeName]: value,
      })
    }
  }

  /**
   * Fermeture du paneau d'une situation
   * @param removeIndispo
   */
  async onCancel(removeIndispo: boolean = false) {
    if (
      removeIndispo &&
      this.currentHR &&
      this.currentHR.indisponibilities.length
    ) {
      await this.updateHuman('indisponibilities', [])
    }

    this.onEditIndex = null

    const findElement = document.getElementById('content')
    if (findElement) {
      findElement.scrollTo({
        behavior: 'smooth',
        top: 0,
      })
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
    this.onLoad(null,false)
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
    const controlIndisponibilitiesError = this.onEditIndex === null // if panel ediction do not control error

    switch (action.id) {
      case 'close':
        {
          this.updateIndisponiblity = null
        }
        break
      case 'modify':
        {
          if (
            this.updateIndisponiblity &&
            !this.updateIndisponiblity.dateStart
          ) {
            alert("Vous devez saisir une date de début d'indisponibilité !")
            return false
          }

          if (this.updateIndisponiblity && !this.updateIndisponiblity.percent) {
            alert("Vous devez saisir un temps d'indisponibilité !")
            return false
          }

          if (
            this.updateIndisponiblity &&
            this.updateIndisponiblity.percent &&
            this.updateIndisponiblity.percent > 100
          ) {
            alert("Vous ne pouvez pas saisir plus de 100% d'indisponibilité !")
            return false
          }

          if (
            this.updateIndisponiblity &&
            !this.updateIndisponiblity.dateStart
          ) {
            alert("Vous devez saisir une date de départ d'indisponibilité !")
            return false
          }

          if (
            this.updateIndisponiblity &&
            !this.allIndisponibilityReferentiel.find(
              (i) => i.id == this.updateIndisponiblity?.contentieux.id
            )
          ) {
            alert("Vous devez saisir un type d'indisponibilité !")
            return false
          }

          // control date start
          if (this.currentHR && this.currentHR.dateStart) {
            const hrDateStart = new Date(this.currentHR.dateStart)

            if (
              this.updateIndisponiblity &&
              this.updateIndisponiblity.dateStart
            ) {
              const indispDateStart = new Date(
                this.updateIndisponiblity.dateStart
              )
              if (hrDateStart.getTime() > indispDateStart.getTime()) {
                alert(
                  "Vous ne pouvez pas saisir une date de début d'indisponibilité antérieure à la date d'arrivée !"
                )
                return false
              }
            }

            if (
              this.updateIndisponiblity &&
              this.updateIndisponiblity.dateStop
            ) {
              const indispDateStop = new Date(
                this.updateIndisponiblity.dateStop
              )
              if (hrDateStart.getTime() > indispDateStop.getTime()) {
                alert(
                  "Vous ne pouvez pas saisir une date de fin d'indisponibilités antérieure à la date d'arrivée !"
                )
                return false
              }
            }
          }

          // control date stop
          if (this.currentHR && this.currentHR.dateEnd) {
            const hrDateStop = new Date(this.currentHR.dateEnd)

            if (
              this.updateIndisponiblity &&
              this.updateIndisponiblity.dateStart
            ) {
              const indispDateStart = new Date(
                this.updateIndisponiblity.dateStart
              )
              if (hrDateStop.getTime() < indispDateStart.getTime()) {
                alert(
                  "Vous ne pouvez pas saisir une date de début d'indisponibilité postérieure à la date de départ !"
                )
                return false
              }
            }

            if (
              this.updateIndisponiblity &&
              this.updateIndisponiblity.dateStop
            ) {
              const indispDateStop = new Date(
                this.updateIndisponiblity.dateStop
              )
              if (hrDateStop.getTime() < indispDateStop.getTime()) {
                alert(
                  "Vous ne pouvez pas saisir une date de fin d'indisponibilité postérieure à la date de départ !"
                )
                return false
              }
            }
          }

          // control date start and date stop
          if (
            this.updateIndisponiblity &&
            this.updateIndisponiblity.dateStart &&
            this.updateIndisponiblity.dateStop
          ) {
            const indispDateStart = new Date(
              this.updateIndisponiblity.dateStart
            )
            const indispDateStop = new Date(this.updateIndisponiblity.dateStop)
            if (indispDateStart.getTime() > indispDateStop.getTime()) {
              alert(
                'Vous ne pouvez pas saisir une date de début postérieure à la date de fin !'
              )
              return false
            }
          }

          if (this.updateIndisponiblity) {
            // force id to int with selector
            this.updateIndisponiblity.contentieux.id =
              +this.updateIndisponiblity.contentieux.id

            const index = this.allIndisponibilities.findIndex(
              (i) => i.id === this.updateIndisponiblity?.id
            )
            const contentieux = this.allIndisponibilityReferentiel.find(
              (c) => c.id === this.updateIndisponiblity?.contentieux.id
            )

            if (!contentieux) {
              alert("Il y a un problème avec l'indisponibilitiés choisie.")
              return false
            }

            if (index !== -1) {
              this.allIndisponibilities[index] = {
                ...this.allIndisponibilities[index],
                ...this.updateIndisponiblity,
                contentieux,
              }
            } else if (this.updateIndisponiblity) {
              this.allIndisponibilities.push({
                ...this.updateIndisponiblity,
                contentieux,
              })
            }
            if (this.currentHR) {
              this.indisponibilityError =
                this.humanResourceService.controlIndisponibilities(
                  this.currentHR,
                  this.allIndisponibilities
                )
              if (controlIndisponibilitiesError && this.indisponibilityError) {
                alert(this.indisponibilityError)
                this.onAddIndispiniblity(this.updateIndisponiblity)
                return false
              } else {
                this.updateIndisponiblity = null
              }

              if (!this.indisponibilityError) {
                await this.updateHuman(
                  'indisponibilities',
                  this.allIndisponibilities
                )
              }
            } else {
              this.updateIndisponiblity = null
            }
          }
        }
        break
      case 'delete':
        {
          const index = this.allIndisponibilities.findIndex(
            (i) =>
              i.id ===
              ((this.updateIndisponiblity && this.updateIndisponiblity.id) ||
                '')
          )
          if (index !== -1) {
            this.allIndisponibilities.splice(index, 1)
            if (this.currentHR) {
              this.indisponibilityError =
                this.humanResourceService.controlIndisponibilities(
                  this.currentHR,
                  this.allIndisponibilities
                )

              if (!this.indisponibilityError) {
                await this.updateHuman(
                  'indisponibilities',
                  this.allIndisponibilities
                )
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
    const index = history
      ? this.histories.findIndex(
          (h) => h.id === history.id && h.dateStart === history.dateStart
        )
      : -1

    if (this.onEditIndex === null) {
      if (index === -1) {
        // add situation
        this.onEditIndex = -1
      } else {
        // edit situation
        this.onEditIndex = index
      }

      setTimeout(() => {
        const findContent = document.getElementById('content')
        if (findContent) {
          const findElements =
            findContent.getElementsByTagName('add-ventilation')
          if (findElements && findElements.length) {
            findContent.scrollTo({
              behavior: 'smooth',
              top:
                findElements[0].getBoundingClientRect().top -
                87 +
                findContent.scrollTop,
            })
          }
        }
      }, 100)
    } else {
      alert('Vous ne pouvez pas modifier plusieurs situations en même temps !')
    }

    if (this.currentHR) {
      // force to control indisponibilities
      this.indisponibilityError =
        this.humanResourceService.controlIndisponibilities(
          this.currentHR,
          this.currentHR.indisponibilities
        )
      console.log({ indisponibilityError: this.indisponibilityError })
    }
  }

  /**
   * Demande de suppression d'une situation
   * @param id
   */
  async onRemoveSituation(id: number) {
    const returnValue = await this.humanResourceService.removeSituation(id)
    console.log(returnValue, this.histories.length, this.onEditIndex)
    if (returnValue) {
      // force to not show on boarding after delete last situation
      this.onEditIndex = null
      this.onLoad(returnValue)
    }
  }

  /**
   * Demande d'extraction de la page au format pdf
   */
  onExport() {
    this.duringPrint = true
    this.appService.alert.next({
      text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
    })
    this.wrapper
      ?.exportAsPdf(
        `Fiche individuelle${
          this.currentHR
            ? ' de ' + this.currentHR.firstName + ' ' + this.currentHR.lastName
            : ''
        } en date du ${new Date().toJSON().slice(0, 10)}.pdf`
      )
      .then(() => {
        this.duringPrint = false
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
  openHelpPanel(type: string) {
    switch (type) {
      case 'indispo':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Ajouter des indisponibilités',
          path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/ventilateur/ajouter-des-indisponibilites',
          subTitle: 'Qu\'est-ce que c\'est ?',
        })
        break
    }
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
    this.basicHrInfo.get(node)?.setValue(object.srcElement.innerText)
  }
}
