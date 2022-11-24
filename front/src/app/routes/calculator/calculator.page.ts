import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { orderBy } from 'lodash'
import { dataInterface } from 'src/app/components/select/select.component'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { DocumentationInterface } from 'src/app/interfaces/documentation'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { AppService } from 'src/app/services/app/app.service'
import { CalculatorService } from 'src/app/services/calculator/calculator.service'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { month } from 'src/app/utils/dates'
@Component({
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage extends MainClass implements OnDestroy, OnInit {
  @ViewChild('wrapper') wrapper: WrapperComponent | undefined
  referentiel: ContentieuReferentielInterface[] = []
  referentielIds: number[] = this.calculatorService.referentielIds.getValue()
  dateStart: Date | null = null
  dateStop: Date | null = null
  sortBy: string = ''
  datas: CalculatorInterface[] = []
  datasFilted: CalculatorInterface[] = []
  isLoading: boolean = false
  maxDateSelectionDate: Date | null = null
  categorySelected: string = 'magistrats'
  documentation: DocumentationInterface = {
    title: 'Calculateur',
    path: 'https://a-just.gitbook.io/documentation-deploiement/calculateur/quest-ce-que-cest',
  }
  lastCategorySelected: string = ''
  selectedFonctionsIds: number[] = []
  fonctions: dataInterface[] = []
  duringPrint: boolean = false

  constructor(
    private humanResourceService: HumanResourceService,
    private calculatorService: CalculatorService,
    private referentielService: ReferentielService,
    private contentieuxOptionsService: ContentieuxOptionsService,
    private activitiesService: ActivitiesService,
    private appService: AppService,
  ) {
    super()
  }

  ngOnInit() {
    this.watch(
      this.contentieuxOptionsService.backupId.subscribe(() => {
        this.onLoad()
      })
    )
    this.watch(
      this.calculatorService.dateStart.subscribe((date) => {
        this.dateStart = date
        if (date === null) {
          this.onCheckLastMonth()
        } else {
          this.onLoad()
        }
      })
    )
    this.watch(
      this.calculatorService.dateStop.subscribe((date) => {
        this.dateStop = date
        this.onLoad()
      })
    )
    this.watch(
      this.humanResourceService.backupId.subscribe(() => {
        this.onLoad()
      })
    )
    this.watch(
      this.calculatorService.referentielIds.subscribe((refs) => {
        this.referentielIds = refs
        this.onLoad()
      })
    )

    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        )

        if (this.referentielIds.length === 0) {
          this.calculatorService.referentielIds.next(
            this.referentiel.map((r) => r.id)
          )
        }

        this.onCheckLastMonth()
      })
    )
  }

  ngOnDestroy() {
    this.watcherDestroy()
  }

  onCheckLastMonth() {
    if (
      this.calculatorService.dateStart.getValue() === null &&
      this.referentiel.length
    ) {
      this.activitiesService.getLastMonthActivities().then((date) => {
        if(date === null) {
          date = new Date()
        }

        console.log(date)
        date = new Date(date ? date : '')
        const max = month(date, 0, 'lastday')
        this.maxDateSelectionDate = max
        console.log(max)

        this.calculatorService.dateStart.next(month(max, -2))
        this.calculatorService.dateStop.next(max)
      })
    }
  }

  onLoad() {
    if (
      this.humanResourceService.backupId.getValue() &&
      this.contentieuxOptionsService.backupId.getValue() &&
      this.calculatorService.referentielIds.getValue().length &&
      this.dateStart !== null &&
      this.dateStop !== null &&
      this.isLoading === false
    ) {
      this.isLoading = true
      this.calculatorService
        .filterList(
          this.categorySelected,
          this.lastCategorySelected === this.categorySelected
            ? this.selectedFonctionsIds
            : null
        )
        .then(({ list, fonctions }) => {
          if (this.lastCategorySelected !== this.categorySelected) {
            this.fonctions = fonctions.map((f: HRFonctionInterface) => ({
              id: f.id,
              value: f.code,
            }))
            this.selectedFonctionsIds = fonctions.map(
              (f: HRFonctionInterface) => f.id
            )
          }
          this.formatDatas(list)
          this.isLoading = false
          this.lastCategorySelected = this.categorySelected
        })
        .catch(() => (this.isLoading = false))
    }
  }

  formatDatas(list: CalculatorInterface[]) {
    this.datas = list.map((l) => ({ ...l, childIsVisible: false }))
    this.filtredDatas()
  }

  filtredDatas() {
    let list = this.datas
    if (this.sortBy) {
      list = orderBy(
        list,
        [
          (o) => {
            // @ts-ignore
            return o[this.sortBy] || 0
          },
        ],
        ['desc']
      )
    }

    this.datasFilted = list
  }

  updateReferentielSelected(type: string = '', event: any = null) {
    if (type === 'referentiel') {
      this.calculatorService.referentielIds.next(event)
    } else if (type === 'dateStart') {
      this.dateStart = new Date(event)
      this.calculatorService.dateStart.next(this.dateStart)
    } else if (type === 'dateStop') {
      this.dateStop = new Date(event)
      this.calculatorService.dateStop.next(this.dateStop)
    }

    this.filtredDatas()
  }

  trackBy(index: number, item: CalculatorInterface) {
    return item.contentieux.id
  }

  onSortBy(type: string) {
    if (this.sortBy === type) {
      this.sortBy = ''
    } else {
      this.sortBy = type
    }

    this.filtredDatas()
  }

  changeCategorySelected(category: string) {
    this.categorySelected = category

    this.onLoad()
  }

  onChangeFonctionsSelected(fonctionsId: string[] | number[]) {
    this.selectedFonctionsIds = fonctionsId.map((f) => +f)
    this.onLoad()
  }

  onShowPanel(type: string) {
    switch (type) {
      case 'données renseignées':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Données renseignées',
          path: 'https://a-just.gitbook.io/documentation-deploiement/calculateur/visualiser-son-activite-grace-aux-donnees-renseignees',
        })
        break
      case 'activité constatée':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Activité constatée',
          path: 'https://a-just.gitbook.io/documentation-deploiement/calculateur/indicateurs-issus-de-lactivite-constatee',
        })
        break
      case 'activité calculée':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Activité calculée',
          path: 'https://a-just.gitbook.io/documentation-deploiement/calculateur/comparer-son-activite-grace-a-lactivite-calculee',
        })
        break
    }
  }

  onExport() {
    this.duringPrint = true
    this.appService.alert.next({
      text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
    })
    this.wrapper?.exportAsPdf('calculateur.pdf', false).then(() => {
      this.duringPrint = false
    })
  }
}
