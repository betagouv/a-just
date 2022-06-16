import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { maxBy, minBy, orderBy, sumBy } from 'lodash'
import { ActionsInterface } from 'src/app/components/popup/popup.component'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HRSituationInterface } from 'src/app/interfaces/hr-situation'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { HRCategoryService } from 'src/app/services/hr-category/hr-category.service'
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { copy } from 'src/app/utils'
import { today } from 'src/app/utils/dates'
import { AddVentilationComponent } from './add-ventilation/add-ventilation.component'

export interface HistoryInterface extends HRSituationInterface {
  indisponibilities: RHActivityInterface[]
  dateStop: Date
  situationForTheFirstTime: boolean
}

@Component({
  templateUrl: './human-resource.page.html',
  styleUrls: ['./human-resource.page.scss'],
})
export class HumanResourcePage extends MainClass implements OnInit, OnDestroy {
  @ViewChild('addDomVentilation')
  addDomVentilation: AddVentilationComponent | null = null
  categories: HRCategoryInterface[] = []
  fonctions: HRFonctionInterface[] = []
  contentieuxReferentiel: ContentieuReferentielInterface[] = []
  currentHR: HumanResourceInterface | null = null
  categoryName: string = ''
  histories: HistoryInterface[] = []
  allIndisponibilities: RHActivityInterface[] = []
  onEditIndex: number | null = null // null (no edition), -1 (new edition), x (x'eme edition)
  updateIndisponiblity: RHActivityInterface | null = null
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = []
  indisponibilityError: string | null = null
  actualHistoryIndex: number | null = null
  actualHistoryDateStart: Date | null = null
  actualHistoryDateStop: Date | null = null

  constructor(
    private humanResourceService: HumanResourceService,
    private route: ActivatedRoute,
    private router: Router,
    private hrFonctionService: HRFonctionService,
    private hrCategoryService: HRCategoryService
  ) {
    super()
  }

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
    this.watch(this.humanResourceService.hr.subscribe(() => this.onLoad()))
    this.hrFonctionService.getAll().then((list) => {
      this.fonctions = list
      this.onLoad()
    })
    this.hrCategoryService.getAll().then((list) => {
      this.categories = list
      this.onLoad()
    })
  }

  ngOnDestroy() {
    this.watcherDestroy()
  }

  onLoad() {
    if (this.categories.length === 0) {
      return
    }

    const id = +this.route.snapshot.params.id
    const allHuman = this.humanResourceService.hr.getValue()

    const findUser = allHuman.find((h) => h.id === id)
    if (findUser) {
      this.currentHR = findUser
      console.log(findUser)

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

  calculTotalTmpActivity(activities: RHActivityInterface[]) {
    activities = this.humanResourceService.filterActivitiesByDate(
      activities || [],
      new Date()
    )

    return sumBy(
      activities.filter((ca) => {
        return this.contentieuxReferentiel.find(
          (r) => r.id === ca.referentielId
        )
          ? true
          : false
      }),
      'percent'
    )
  }

  formatHRHistory() {
    if (this.fonctions.length === 0 || !this.currentHR) {
      return
    }

    this.histories = []
    this.allIndisponibilities = this.currentHR.indisponibilities || []
    const situations = orderBy(this.currentHR.situations || [], [
      function (o: HRSituationInterface) {
        const date = new Date(o.dateStart)
        return date.getTime()
      },
    ])

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

    const minDate = minBy(listAllDates, (d) => d.getTime())
    let maxDate = maxBy(listAllDates, (d) => d.getTime())

    if (!minDate || !maxDate) {
      this.onEditIndex = -1
      return
    }

    if (maxDate.getTime() < today().getTime() && !this.currentHR.dateEnd) {
      maxDate = today()
    }

    const currentDate = new Date(maxDate)
    let idsDetected: number[] = []
    let lastSituationId = null
    this.actualHistoryIndex = null
    console.log(minDate, maxDate)

    while (currentDate.getTime() >= minDate.getTime()) {
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
        const dateStop = new Date(currentDate)
        let etp = (findSituation && findSituation.etp) || 0

        if (currentDateEnd && currentDateEnd.getTime() <= dateStop.getTime()) {
          etp = 0
        }

        // new list
        this.histories.push({
          id: (findSituation && findSituation.id) || -1,
          category: (findSituation && findSituation.category) || null,
          fonction: (findSituation && findSituation.fonction) || null,
          etp,
          indisponibilities: findIndispos,
          activities: (findSituation && findSituation.activities) || [],
          dateStart: new Date(),
          dateStop,
          situationForTheFirstTime: false,
        })
      }

      currentDate.setDate(currentDate.getDate() - 1)
    }

    // last situation can remove situation
    if (this.histories.length) {
      this.histories[this.histories.length - 1].situationForTheFirstTime = true
    }

    // place date start
    this.histories = this.histories.map((h, index) => {
      const dateStop =
        index + 1 < this.histories.length
          ? today(this.histories[index + 1].dateStop)
          : today(minDate)
      h.dateStart = new Date(dateStop)
      dateStop.setDate(dateStop.getDate() + 1)

      if (
        (index === 0 && this.histories.length > 1) ||
        (index > 0 && index < this.histories.length - 1)
      ) {
        h.dateStart.setDate(h.dateStart.getDate() + 1)
      }

      if (
        h.dateStart.getTime() <= today().getTime() &&
        today().getTime() <= h.dateStop.getTime() &&
        this.actualHistoryIndex === null
      ) {
        this.actualHistoryIndex = index
      }

      return h
    })

    this.actualHistoryDateStart = null
    this.actualHistoryDateStop = null
    if (this.actualHistoryIndex === null) {
      // check if past or the future
      if (this.histories.length) {
        if (this.histories[0].dateStart.getTime() > today().getTime()) {
          this.actualHistoryDateStop = this.histories[0].dateStart
        } else if (
          this.histories[this.histories.length - 1].dateStop.getTime() <
          today().getTime()
        ) {
          const dateStop = new Date(this.histories[this.histories.length - 1].dateStop)
          dateStop.setDate(dateStop.getDate() + 1)
          this.actualHistoryDateStart = dateStop
        }
      }
    } else {
      this.actualHistoryDateStart =
        this.histories[this.actualHistoryIndex].dateStart
      this.actualHistoryDateStop =
        this.histories[this.actualHistoryIndex].dateStop
    }

    console.log(
      this.histories,
      this.actualHistoryDateStart,
      this.actualHistoryDateStop
    )
  }

  trackByDate(index: number, item: any) {
    return item.dateStart
  }

  async onDelete() {
    if (this.currentHR) {
      if (await this.humanResourceService.removeHrById(this.currentHR.id)) {
        this.router.navigate(['/ventilations'])
      }
    }
  }

  async updateHuman(nodeName: string, value: any) {
    if (this.currentHR) {
      if (value && typeof value.innerText !== 'undefined') {
        value = value.innerText
      }

      await this.humanResourceService.updatePersonById(this.currentHR.id, {
        [nodeName]: value,
      })
    }
  }

  async onCancel(removeIndispo: boolean = false) {
    if (removeIndispo) {
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

  onSave() {
    if (this.addDomVentilation) {
      this.addDomVentilation.onSave()
    }
  }

  onNewUpdate() {
    this.onEditIndex = null
    this.onLoad()
  }

  onAddIndispiniblity(indispo: RHActivityInterface | null = null) {
    this.updateIndisponiblity = indispo
      ? copy(indispo)
      : {
          id: this.allIndisponibilities.length * -1 - 1,
          percent: 0,
          contentieux: {
            ...this.allIndisponibilityReferentiel[0],
          },
          dateStart: new Date(),
        }
  }

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

  onSelectSituationToEdit(index: number | null = null) {
    if (this.onEditIndex === null) {
      if (index === null) {
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
  }

  async onRemoveSituation(id: number) {
    const returnValue = await this.humanResourceService.removeSituation(id)
    if (
      returnValue === true &&
      this.histories.length === 0 &&
      this.onEditIndex !== null
    ) {
      // force to not show on boarding after delete last situation
      this.onEditIndex = null
    }
  }
}
