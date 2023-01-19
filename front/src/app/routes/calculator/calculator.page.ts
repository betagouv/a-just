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
import { UserService } from 'src/app/services/user/user.service'
import { month } from 'src/app/utils/dates'
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from 'src/app/utils/user'

/**
 * Page du calculateur
 */

@Component({
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage extends MainClass implements OnDestroy, OnInit {
  /**
   * Dom du wrapper
   */
  @ViewChild('wrapper') wrapper: WrapperComponent | undefined
  /**
   * Référentiel
   */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Liste des id des référentiels
   */
  referentielIds: number[] = this.calculatorService.referentielIds.getValue()
  /** 
   * Date de début du calcul
   */
  dateStart: Date | null = null
  /**
   * Date de fin du calcul
   */
  dateStop: Date | null = null
  /**
   * Tri ou non
   */
  sortBy: string = ''
  /**
   * Liste des lignes du calculateurs venant du back
   */
  datas: CalculatorInterface[] = []
  /**
   * Filtre des lignes du calculateur visible
   */
  datasFilted: CalculatorInterface[] = []
  /**
   * En chargement
   */
  isLoading: boolean = false
  /**
   * Date max du calculateur
   */
  maxDateSelectionDate: Date | null = null
  /**
   * Catégories selectionnée (magistrats, fonctionnaire)
   */
  categorySelected: string | null = null
  /**
   * Lien de la documentation
   */
  documentation: DocumentationInterface = {
    title: 'Calculateur',
    path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/calculateur/quest-ce-que-cest',
  }
  /**
   * Mémorisation de la dernière categorie
   */
  lastCategorySelected: string | null = null
  /**
   * Liste des ids des fonctions 
   */
  selectedFonctionsIds: number[] = []
  /**
   * Liste des fonctions
   */
  fonctions: dataInterface[] = []
  /**
   * Variable en cours d'export de page
   */
  duringPrint: boolean = false
  /**
   * Peux voir l'interface magistrat
   */
  canViewMagistrat: boolean = false
  /**
   * Peux voir l'interface greffier
   */
  canViewGreffier: boolean = false
  /**
   * Peux voir l'interface contractuel
   */
  canViewContractuel: boolean = false

  /**
   * Constructeur
   * @param humanResourceService 
   * @param calculatorService 
   * @param referentielService 
   * @param contentieuxOptionsService 
   * @param activitiesService 
   * @param appService 
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private calculatorService: CalculatorService,
    private referentielService: ReferentielService,
    private contentieuxOptionsService: ContentieuxOptionsService,
    private activitiesService: ActivitiesService,
    private appService: AppService,
    private userService: UserService,
  ) {
    super()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnInit() {
    this.watch(this.userService.user.subscribe((u) => {
      this.canViewMagistrat = userCanViewMagistrat(u)
      this.canViewGreffier = userCanViewGreffier(u)
      this.canViewContractuel = userCanViewContractuel(u)

      if (this.canViewMagistrat) {
        this.categorySelected = this.MAGISTRATS
      } else if (this.canViewGreffier) {
        this.categorySelected = this.FONCTIONNAIRES
      } else {
        this.categorySelected = null
      }
    }))

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

  /**
   * Suppresion des observables lors de la suppression de la page
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Demande au serveur quelle est la dernière date des datas
   */
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

  /**
   * Chargement des données back
   */
  onLoad() {
    if (
      this.humanResourceService.backupId.getValue() &&
      this.contentieuxOptionsService.backupId.getValue() &&
      this.calculatorService.referentielIds.getValue().length &&
      this.dateStart !== null &&
      this.dateStop !== null &&
      this.isLoading === false &&
      this.categorySelected
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

  /**
   * Préformate les données des données du serveur
   * @param list 
   */
  formatDatas(list: CalculatorInterface[]) {
    this.datas = list.map((l) => ({ ...l, childIsVisible: false }))
    this.filtredDatas()
  }

  /**
   * Trier les datas en fonction d'un trie
   */
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

  /**
   * Mise à jour des données pour l'appel au serveur
   * @param type 
   * @param event 
   */
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

  /**
   * Optimisation de charge de la liste
   * @param index 
   * @param item 
   * @returns 
   */
  trackBy(index: number, item: CalculatorInterface) {
    return item.contentieux.id
  }

  /**
   * Demande de trie en fonction d'une colonne
   * @param type 
   */
  onSortBy(type: string) {
    if (this.sortBy === type) {
      this.sortBy = ''
    } else {
      this.sortBy = type
    }

    this.filtredDatas()
  }

  /**
   * Changement de la catégorie selectionné puis appel au serveur
   * @param category 
   */
  changeCategorySelected(category: string) {
    this.categorySelected = category

    this.onLoad()
  }

  /**
   * Changement des fonctions selectionnés puis appel au serveur
   * @param fonctionsId 
   */
  onChangeFonctionsSelected(fonctionsId: string[] | number[]) {
    this.selectedFonctionsIds = fonctionsId.map((f) => +f)
    this.onLoad()
  }

  /**
   * Force l'ouverture d'un paneau d'aide
   * @param type 
   */
  onShowPanel(type: string) {
    switch (type) {
      case 'données renseignées':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Données renseignées',
          path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/calculateur/visualiser-son-activite-grace-aux-donnees-renseignees',
        })
        break
      case 'activité constatée':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Activité constatée',
          path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/calculateur/indicateurs-issus-de-lactivite-constatee',
        })
        break
      case 'activité calculée':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Activité calculée',
          path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/calculateur/comparer-son-activite-grace-a-lactivite-calculee',
        })
        break
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
    this.wrapper?.exportAsPdf('calculateur.pdf', false).then(() => {
      this.duringPrint = false
    })
  }
}
