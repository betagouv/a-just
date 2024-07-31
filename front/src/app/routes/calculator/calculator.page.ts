import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { MatCalendarCellClassFunction } from '@angular/material/datepicker'
import { Router } from '@angular/router'
import { orderBy } from 'lodash'
import { IntroJSStep } from 'src/app/components/intro-js/intro-js.component'
import { dataInterface } from 'src/app/components/select/select.component'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { DocumentationInterface } from 'src/app/interfaces/documentation'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { CalculatorService } from 'src/app/services/calculator/calculator.service'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { UserService } from 'src/app/services/user/user.service'
import { month } from 'src/app/utils/dates'
import {
  userCanViewContractuel,
  userCanViewGreffier,
  userCanViewMagistrat,
} from 'src/app/utils/user'

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
  categorySelected: string | null = null
  /**
   * Lien de la documentation
   */
  documentation: DocumentationInterface = {
    title: 'Calculateur',
    path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/calculateur/quest-ce-que-cest',
    printSubTitle: true,
  }
  /**
   * Mémorisation de la dernière categorie
   */
  lastCategorySelected: string | null = null
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
   * Intro JS Steps
   */
  introSteps: IntroJSStep[] = [
    {
      target: '#wrapper-contener',
      title: 'A quoi sert le calculateur ?',
      intro:
        "Le calculateur vous permet de visualiser en un coup d’œil quelques <b>indicateurs simples, calculés à partir des données d’effectifs et d’activité renseignées dans A-JUST</b> et, si vous le souhaitez, de les <b>comparer à un référentiel</b> que vous auriez renseigné.<br/><br/>Vous pouvez sélectionner la <b>catégorie d'agents</b> souhaitée et également restreindre si besoin les calculs à <b>une ou plusieurs fonctions</b>.<br/><br/>Vous pourrez <b>exporter</b> ces restitutions en PDF pour les enregistrer.",
    },
    {
      target: '.sub-main-header',
      title: 'Choisir la période',
      intro:
        "sur laquelle effectuer les calculs. Certaines des données étant des <b>moyennes</b>, elles seront d’autant plus représentatives que la période sélectionnée sera longue.",
    },
    {
      target: 'aj-referentiel-calculator:first-child .item.actual',
      title: "Les données renseignées",
      intro:
        "Vous pouvez visualiser, pour chaque contentieux ou sous-contentieux :<ul><li>Les <b>entrées et sorties</b> moyennes mensuelles sur la période sélectionnée (calculées à partir des données d’activité) ;</li><li>Le <b>stock</b> à la fin de la période sélectionnée (tel qu’affiché dans les données d’activité) ;</li><li>Les <b>ETPT</b> affectés à chaque contentieux sur la période sélectionnée (calculés à partir des données individuelles d’affectation saisies dans le ventilateur) pour chacune des catégories d'agents (magistrats, fonctionnaires, équipe autour du magistrat = EAM).</li></ul>",
    },
    {
      target: 'aj-referentiel-calculator:first-child .item.activity',
      title: "Les données de l'activité constatée",
      intro:
        "Cette section permet de <b>visualiser deux indicateurs simples</li>, calculés à partir des « <b>Données renseignées</b> » :<ul><li>le <b>taux de couverture</b></li><li>et le <b>DTES</b> (Délai Théorique d’Écoulement du Stock).</li></ul><br/>Vous pourrez aussi visualiser le <b>temps de traitement moyen par dossier observé</b> sur la période antérieure qui constitue une clé de projection pour les simulations.",
    },
    {
      target: 'aj-referentiel-calculator:first-child .item.calculate',
      title: "Les données de l'activité calculée",
      intro:
        "Les données de l'activité calculée permettent, si vous le souhaitez, de <b>comparer les indicateurs de l’activité constatée</b>, décrits précédemment, à ceux d'un <b>référentiel théorique</b> que vous avez la faculté de saisir dans la page \"<b>Temps moyens</b>\".<div class=\"intro-js-action\"><a href=\"/temps-moyens\">J'accède aux temps moyens</a></div>",
    },
    {
      target: '.ref-button',
      title: 'Enregistrez les temps moyens constatés',
      intro:
        "comme référentiel, si vous souhaitez comparer leur évolution dans la juridiction d'une période à l'autre.",
    },
    {
      target: 'aj-options-backup-panel',
      title: 'Mes temps moyens de comparaison',
      intro:
        "Si vous avez renseigné des temps moyens de référence, il vous suffit de <b>sélectionner le référentiel de votre choix dans ce menu déroulant</b>.",
    },
  ]
  /**
   * Labels of fct selected
   */
  fonctionRealValue = ''
  /**
   * Onglet selectionné
   */
  tabSelected = 1

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
    private userService: UserService,
    private router: Router
  ) {
    super()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnInit() {
    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)

        if (this.canViewMagistrat) {
          this.categorySelected = this.MAGISTRATS
        } else if (this.canViewGreffier) {
          this.categorySelected = this.FONCTIONNAIRES
        } else {
          this.categorySelected = null
          alert(
            "Vos droits ne vous permettent pas d'exécuter un calcul, veuillez contacter un administrateur."
          )
        }
        this.calculatorService.categorySelected.next(this.categorySelected)
      })
    )

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
            this.referentielService.idsIndispo.indexOf(r.id) === -1
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
        if (date === null) {
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
            this.calculatorService.selectedFonctionsIds.next(this.selectedFonctionsIds)
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
    /*const backupLabel = localStorage.getItem('backupLabel')
    backupLabel && filterReferentielCalculator(list, backupLabel)*/

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
  trackByCont(index: number, item: CalculatorInterface) {
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
    this.calculatorService.categorySelected.next(this.categorySelected)
    this.onLoad()
  }

  /**
   * Changement des fonctions selectionnés puis appel au serveur
   * @param fonctionsId
   */
  onChangeFonctionsSelected(fonctionsId: string[] | number[]) {
    this.selectedFonctionsIds = fonctionsId.map((f) => +f)
    this.calculatorService.selectedFonctionsIds.next(this.selectedFonctionsIds)
    this.onLoad()
    this.getFctRealValue()
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
          printSubTitle: true,
        })
        break
      case 'activité constatée':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Activité constatée',
          path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/calculateur/indicateurs-issus-de-lactivite-constatee',
          printSubTitle: true,
        })
        break
      case 'activité calculée':
        this.wrapper?.onForcePanelHelperToShow({
          title: 'Activité calculée',
          path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/calculateur/comparer-son-activite-grace-a-lactivite-calculee',
          printSubTitle: true,
        })
        break
    }
  }

  /**
   * Demande d'extraction de la page au format pdf
   */
  onExport() {
    this.duringPrint = true
    this.wrapper
      ?.exportAsPdf(
        `Calculateur_par ${this.userService.user.getValue()!.firstName
        }_${this.userService.user.getValue()!.lastName!}_le ${new Date()
          .toJSON()
          .slice(0, 10)}.pdf`,
        false
      )
      .then(() => {
        this.duringPrint = false
      })
  }

  /**
   * Custom renderer on dates calendar visible
   * @param cellDate 
   * @param view 
   * @returns 
   */
  dateClass: MatCalendarCellClassFunction<any> = (cellDate, view) => {
    /*if (view === 'month') {
      return 'material-date-calendar-no-datas';
    }*/

    return '';
  };


  calculatorSaver() {
    let refToSave = new Array()

    this.datas.map(x => {
      if (x.childrens.length > 0)
        x.childrens.map(y => {
          refToSave.push({
            contentieux: {
              id: y.contentieux.id,
              label: y.contentieux.label
            },
            averageProcessingTime: y.magRealTimePerCase,
          })
        })
      refToSave.push({
        contentieux: {
          id: x.contentieux.id,
          label: x.contentieux.label
        },
        averageProcessingTime: x.magRealTimePerCase,
      })

    })

    this.contentieuxOptionsService.contentieuxOptions.next(refToSave)
    this.contentieuxOptionsService.optionsIsModify.next(true)
    this.contentieuxOptionsService.onSaveDatas(true)

  }

  /**
   * Génère la valeur du filtre de fonction
   */
  getFctRealValue() {
    let tmpStr = ''
    let counter = 0
    this.selectedFonctionsIds.map((id) => {
      const find = this.fonctions.find((d) => d.id === id)
      if (find) {
        if (counter < 3)
          tmpStr = tmpStr.length ? [tmpStr, find.value].join(', ') : find.value
        counter++
      }
    })
    if (counter > 4) tmpStr = tmpStr + ' et ' + (counter - 3) + ' autres de plus'
    else if (counter === 4)
      tmpStr = tmpStr + ' et ' + (counter - 3) + ' autre de plus'

    if (this.selectedFonctionsIds.length === this.fonctions.length)
      tmpStr = ''

    this.fonctionRealValue = tmpStr
  }
}
