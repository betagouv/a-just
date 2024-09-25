import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core'
import { MatCalendarCellClassFunction } from '@angular/material/datepicker'
import * as _ from 'lodash'
import { orderBy } from 'lodash'
import { IntroJSStep } from 'src/app/components/intro-js/intro-js.component'
import { dataInterface } from 'src/app/components/select/select.component'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
import { BackupInterface } from 'src/app/interfaces/backup'
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
import { AnalyticsLine } from './template-analytics/template-analytics.component'
import { BackupSettingsService } from 'src/app/services/backup-settings/backup-settings.service'
import { BACKUP_SETTING_COMPARE } from 'src/app/constants/backup-settings'
import { BackupSettingInterface } from 'src/app/interfaces/backup-setting'
import { ActivatedRoute, Router } from '@angular/router'
import { AppService } from 'src/app/services/app/app.service'
import { Location } from '@angular/common'
import {
  getCategoryColor,
  FONCTIONNAIRES,
  MAGISTRATS,
} from 'src/app/constants/category'
import { fixDecimal } from 'src/app/utils/numbers'
import { NB_MAX_CUSTOM_COMPARAISONS } from 'src/app/constants/calculator'
import { KPIService } from 'src/app/services/kpi/kpi.service'
import {
  CALCULATOR_OPEN_CHARTS_VIEW,
  CALCULATOR_OPEN_CONMPARAISON_RANGE,
  CALCULATOR_OPEN_CONMPARAISON_REFERENTIEL,
  CALCULATOR_SELECT_GREFFE,
  EXECUTE_CALCULATOR_CHANGE_DATE,
} from 'src/app/constants/log-codes'
import { BehaviorSubject } from 'rxjs'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'

/**
 * Page du calculateur
 */

@Component({
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage
  extends MainClass
  implements OnDestroy, OnInit, AfterViewInit
{
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
   * Date de début du calcul
   */
  optionDateStart: Date | null = null
  /**
   * Date de fin du calcul
   */
  optionDateStop: Date | null = null
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
    title: 'Cockpit',
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
      title: 'A quoi sert le cockpit ?',
      intro:
        "Le cockpit vous permet de visualiser en un coup d’œil quelques <b>indicateurs simples, calculés à partir des données d’effectifs et d’activité renseignées dans A-JUST</b> et, si vous le souhaitez, de les <b>comparer à un référentiel</b> que vous auriez renseigné.<br/><br/>Vous pouvez sélectionner la <b>catégorie d'agents</b> souhaitée et également restreindre si besoin les calculs à <b>une ou plusieurs fonctions</b>.<br/><br/>Vous pourrez <b>exporter</b> ces restitutions en PDF pour les enregistrer.",
    },
    {
      target: '.sub-main-header',
      title: 'Choisir la période',
      intro:
        'sur laquelle effectuer les calculs. Certaines des données étant des <b>moyennes</b>, elles seront d’autant plus représentatives que la période sélectionnée sera longue.',
    },
    {
      target: 'aj-referentiel-calculator:first-child .item.actual',
      title: 'Les données renseignées',
      intro:
        "Vous pouvez visualiser, pour chaque contentieux ou sous-contentieux :<ul><li>Les <b>entrées et sorties</b> moyennes mensuelles sur la période sélectionnée (calculées à partir des données d’activité) ;</li><li>Le <b>stock</b> à la fin de la période sélectionnée (tel qu’affiché dans les données d’activité) ;</li><li>Les <b>ETPT</b> affectés à chaque contentieux sur la période sélectionnée (calculés à partir des données individuelles d’affectation saisies dans le ventilateur) pour chacune des catégories d'agents (magistrats, fonctionnaires, équipe autour du magistrat = EAM).</li></ul>",
    },
    {
      target: 'aj-referentiel-calculator:first-child .item.activity',
      title: "Les données de l'activité constatée",
      intro:
        'Cette section permet de <b>visualiser deux indicateurs simples</li>, calculés à partir des « <b>Données renseignées</b> » :<ul><li>le <b>taux de couverture</b></li><li>et le <b>DTES</b> (Délai Théorique d’Écoulement du Stock).</li></ul><br/>Vous pourrez aussi visualiser le <b>temps de traitement moyen par dossier observé</b> sur la période antérieure qui constitue une clé de projection pour les simulations.',
    },
    {
      target: 'aj-referentiel-calculator:first-child .item.calculate',
      title: "Les données de l'activité calculée",
      intro:
        'Les données de l\'activité calculée permettent, si vous le souhaitez, de <b>comparer les indicateurs de l’activité constatée</b>, décrits précédemment, à ceux d\'un <b>référentiel théorique</b> que vous avez la faculté de saisir dans la page "<b>Temps moyens</b>".<div class="intro-js-action"><a href="/temps-moyens">J\'accède aux temps moyens</a></div>',
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
        'Si vous avez renseigné des temps moyens de référence, il vous suffit de <b>sélectionner le référentiel de votre choix dans ce menu déroulant</b>.',
    },
  ]
  /**
   * Labels of fct selected
   */
  fonctionRealValue = ''
  /**
   * Onglet selectionné
   */
  tabSelected = 0
  /**
   * Affichage du menu déroulant de référentiel de temps
   */
  showPicker = false
  /**
   * Edition d'un referentiel de comparaison
   */
  onEdit = false
  /**
   * Choix du mode de comparaison 1=> date à date 2=> référentiel
   */
  compareOption = 0
  /**
   * liste des référentiels
   */
  referentiels: any[] = []
  /**
   * Liste des sauvegardes
   */
  backups: BackupInterface[] = []
  /**
   * Liste des sauvegardes filtré par catégorie
   */
  filteredBackups: BackupInterface[] = []
  /**
   * Template to compare
   */
  compareTemplates: AnalyticsLine[] | null = null
  /**
   * Liste des comparaisons sauvegardés
   */
  backupSettingSaved: BackupSettingInterface[] = []
  /**
   * Label du ref à comparer
   */
  compareAtString: string = ''
  /**
   * Premier chargement
   */
  firstLoading = true
  /**
   * on add delay to time out
   */
  onTimeoutLoad: any = null
  /**
   * Lock global loader
   */
  lockLoader: BehaviorSubject<boolean> = new BehaviorSubject(false)
  /**
   * Title created from popup while compare loaded
   */
  createdTitle: null | string = null
  /**
   * Constructeur
   * @param humanResourceService
   * @param calculatorService
   * @param referentielService
   * @param contentieuxOptionsService
   * @param activitiesService
   * @param appService
   * @param backupSettingsService
   * @param appService
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private calculatorService: CalculatorService,
    private referentielService: ReferentielService,
    private contentieuxOptionsService: ContentieuxOptionsService,
    private activitiesService: ActivitiesService,
    public userService: UserService,
    private backupSettingsService: BackupSettingsService,
    private router: Router,
    private appService: AppService,
    private route: ActivatedRoute,
    private location: Location,
    private kpiService: KPIService
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
          (r) => this.referentielService.idsIndispo.indexOf(r.id) === -1
        )

        if (this.referentielIds.length === 0) {
          this.calculatorService.referentielIds.next(
            this.referentiel.map((r) => r.id)
          )
        }

        this.onCheckLastMonth()
      })
    )

    // Chargement des référentiels
    this.watch(
      this.contentieuxOptionsService.backups.subscribe((b) => {
        this.backups = b
      })
    )

    this.watch(
      this.lockLoader.subscribe((l) => {
        if (l) {
          if (this.onTimeoutLoad) {
            clearTimeout(this.onTimeoutLoad)
          }
        } else {
          this.onLoad()
        }
      })
    )
  }

  /**
   * Chargement de la liste des fonctions
   */
  loadFunctions() {
    let cat =
      this.categorySelected?.toUpperCase() === 'FONCTIONNAIRES'
        ? 'Greffe'
        : 'Magistrat'

    const findCategory =
      this.humanResourceService.categories
        .getValue()
        .find((c: HRCategoryInterface) => c.label === cat) || null

    this.fonctions = this.humanResourceService.fonctions
      .getValue()
      .filter((v) => v.categoryId === findCategory?.id)
      .map(
        (f: HRFonctionInterface) =>
          ({
            id: f.id,
            value: f.code,
          } as dataInterface)
      )
    this.lastCategorySelected = this.categorySelected
    this.selectedFonctionsIds = this.fonctions.map((a) => a.id)
  }

  ngAfterViewInit() {
    this.watch(
      this.route.params.subscribe((params) => {
        if (params['datestart'] && params['datestop']) {
          this.dateStart = new Date(this.route.snapshot.params['datestart'])
          this.calculatorService.dateStart.next(this.dateStart)
          this.dateStop = new Date(this.route.snapshot.params['datestop'])
          this.calculatorService.dateStop.next(this.dateStop)
          this.changeCategorySelected(
            this.route.snapshot.params['category'] === 'magistrats'
              ? this.MAGISTRATS
              : this.FONCTIONNAIRES
          )
          this.tabSelected = 1
          this.onEdit = true
          this.location.replaceState('/cockpit')
          this.filterBackupsByCategory()
        }
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

        date = new Date(date ? date : '')
        const max = month(date, 0, 'lastday')
        this.maxDateSelectionDate = max

        const min = month(max, -11)
        this.calculatorService.dateStart.next(min)
        this.calculatorService.dateStop.next(max)
        this.onLoadComparaisons()
      })
    }
  }

  /**
   * Charge la liste des contentieux de comparaison
   */
  onLoadComparaisons(forceSelection = false) {
    this.backupSettingsService.list([BACKUP_SETTING_COMPARE]).then((l) => {
      let refs = this.referentiels
      let indexRef = -1
      do {
        indexRef = refs.findIndex((r) => !r.isLocked)
        if (indexRef !== -1) {
          refs.splice(indexRef, 1)
        }
      } while (indexRef !== -1)

      let preselectedRefId = -1
      if (this.compareOption === 2) {
        const bup = this.backups.find((b) => b.selected)
        if (bup) {
          preselectedRefId = bup.id
        }
        refs.map((r) => (r.selected = false))
      }

      if (this.compareOption === 1) {
        const bup = l.find((b) => b.label === this.createdTitle)
        if (bup) {
          preselectedRefId = bup.id
          this.createdTitle = null
        }
        refs.map((r) => (r.selected = false))
        l.slice(0, NB_MAX_CUSTOM_COMPARAISONS).map((l) => {
          refs.push({
            label: l.label,
            selected: l && l.id === preselectedRefId ? true : false,
            isLocked: false,
            datas: l.datas,
          })
        })
      } else {
        l.slice(0, NB_MAX_CUSTOM_COMPARAISONS).map((l) => {
          refs.push({
            label: l.label,
            selected:
              l.datas && l.datas.referentielId === preselectedRefId
                ? true
                : false,
            isLocked: false,
            datas: l.datas,
          })
        })
      }

      if (forceSelection) {
        refs = refs.map((i) => ({
          ...i,
          selected: true,
        }))
      }

      for (let i = NB_MAX_CUSTOM_COMPARAISONS; i < l.length; i++) {
        this.backupSettingsService.removeSetting(l[i].id)
      }

      this.referentiels = [...refs]
      this.backupSettingSaved = l
    })
  }

  /**
   * Remove setting saved
   * @param refSettingLabel
   */
  onRemoveSetting(refSettingLabel: string) {
    const backupSettingSaved = this.backupSettingSaved.find(
      (b) => b.label === refSettingLabel
    )
    if (backupSettingSaved) {
      if (this.referentiels.length <= 1) {
        this.showPicker = false
        this.tabSelected = 1
        this.unselectTemplate()
        this.logChartView()
      }

      this.backupSettingsService
        .removeSetting(backupSettingSaved.id)
        .then(() => this.onLoadComparaisons())
    }
  }

  /**
   * Chargement des données back
   */
  onLoad(loadDetail = true) {
    if (this.onTimeoutLoad) {
      clearTimeout(this.onTimeoutLoad)
    }

    this.onTimeoutLoad = setTimeout(
      () => {
        if (
          this.humanResourceService.backupId.getValue() &&
          this.calculatorService.referentielIds.getValue().length &&
          this.dateStart !== null &&
          this.dateStop !== null &&
          this.isLoading === false &&
          this.categorySelected
        ) {
          this.onTimeoutLoad = null
          this.isLoading = true
          this.appService.appLoading.next(true)
          this.calculatorService
            .filterList(
              this.categorySelected,
              this.lastCategorySelected === this.categorySelected
                ? this.selectedFonctionsIds
                : null,
              this.dateStart,
              this.dateStop,
              false
            )
            .then(({ list, fonctions }) => {
              this.appService.appLoading.next(false)
              if (this.lastCategorySelected !== this.categorySelected) {
                this.fonctions = fonctions.map((f: HRFonctionInterface) => ({
                  id: f.id,
                  value: f.code,
                }))
                this.selectedFonctionsIds = fonctions.map(
                  (f: HRFonctionInterface) => f.id
                )
                this.calculatorService.selectedFonctionsIds.next(
                  this.selectedFonctionsIds
                )
              }
              this.formatDatas(list)
              this.isLoading = false
              this.lastCategorySelected = this.categorySelected

              if (this.firstLoading === false)
                this.appService.notification(
                  'Les données du cockpit ont été mis à jour !'
                )
              this.firstLoading = false
            })
            .catch(() => {
              this.isLoading = false
            })
            .finally(() => {
              if (this.categorySelected && loadDetail) {
                this.calculatorService
                  .filterList(
                    this.categorySelected,
                    this.lastCategorySelected === this.categorySelected
                      ? this.selectedFonctionsIds
                      : null,
                    this.dateStart,
                    this.dateStop,
                    true
                  )
                  .then(({ list }) => {
                    this.formatDatas(list)
                  })
              }
            })
        }
      },
      this.firstLoading ? 0 : 1500
    )
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
      let sort = this.sortBy
      if (
        this.sortBy === 'magRealTimePerCase' &&
        this.categorySelected !== 'magistrats'
      ) {
        sort = 'fonRealTimePerCase'
      }
      list = orderBy(
        list,
        [
          (o) => {
            // @ts-ignore
            return o[sort] || 0
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
      this.unselectTemplate()
      this.kpiService.register(EXECUTE_CALCULATOR_CHANGE_DATE, '')
    } else if (type === 'dateStop') {
      this.dateStop = month(new Date(event), undefined, 'lastDay')
      this.calculatorService.dateStop.next(this.dateStop)
      this.unselectTemplate()
      this.kpiService.register(EXECUTE_CALCULATOR_CHANGE_DATE, '')
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
    this.fonctionRealValue = ''
    this.loadFunctions()
    if (this.categorySelected === this.FONCTIONNAIRES)
      this.kpiService.register(CALCULATOR_SELECT_GREFFE, '')
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

  selectAllFct() {
    this.selectedFonctionsIds = this.fonctions.map((x) => x.id)
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
        `Cockpit_par ${
          this.userService.user.getValue()!.firstName
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

    return ''
  }

  calculatorSaver() {
    let refToSave = new Array()

    this.datas.map((x) => {
      if (x.childrens.length > 0)
        x.childrens.map((y) => {
          refToSave.push({
            contentieux: {
              id: y.contentieux.id,
              label: y.contentieux.label,
            },
            averageProcessingTime: y.magRealTimePerCase,
          })
        })
      refToSave.push({
        contentieux: {
          id: x.contentieux.id,
          label: x.contentieux.label,
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
    if (counter > 4) tmpStr = tmpStr + ' et ' + (counter - 3) + ' autres'
    else if (counter === 4)
      tmpStr = tmpStr + ' et ' + (counter - 3) + ' autre de plus'

    if (this.selectedFonctionsIds.length === this.fonctions.length) tmpStr = ''

    this.fonctionRealValue = tmpStr
  }

  /**
   * Renvoi la valeur de la date Mois - Année
   * @param date
   * @returns
   */
  getRealValue(date: Date | null) {
    if (date !== null) {
      date = new Date(date)
      return `${this.getShortMonthString(date)} ${date.getFullYear()}`
    } else return ''
  }

  /**
   * Choix dans dropdown du référentiel de comparaison
   * @param ref
   */
  radioSelect(ref: any) {
    this.referentiels.map((x) => {
      x.selected = false
    })
    ref.selected = true

    if (ref.datas) {
      if (ref.isLocked) {
        this.backupSettingsService
          .addOrUpdate(ref.label, BACKUP_SETTING_COMPARE, {
            dateStart: this.optionDateStart,
            dateStop: this.optionDateStop,
          })
          .then(() => this.onLoadComparaisons(true))
      }

      if (ref.datas.dateStart) {
        this.compareOption = 1
        this.optionDateStart = new Date(ref.datas.dateStart)
        this.optionDateStop = month(new Date(ref.datas.dateStop), 0, 'lastday')
        this.kpiService.register(
          CALCULATOR_OPEN_CONMPARAISON_RANGE,
          ref.label + ''
        )
      } else if (ref.datas.referentielId) {
        this.compareOption = 2
        this.backups = this.backups.map((b) => ({
          ...b,
          selected: ref.datas.referentielId == b.id,
        }))
        this.kpiService.register(
          CALCULATOR_OPEN_CONMPARAISON_REFERENTIEL,
          ref.datas.referentielId + ''
        )
      }
      this.showPicker = false
      this.onLoadCompare()
    }
  }

  /**
   * Ellipsis version JS à 40 char
   * @param str
   * @returns
   */
  trunc(str: string, len = 40) {
    return _.truncate(str, { length: len, separator: '...' })
  }

  /**
   * Selectionne le backup dans la liste déroulante de la popin
   * @param backup
   */
  selectBackup(backup: BackupInterface) {
    this.backups.map((x) => {
      x.selected = false
    })
    backup.selected = true
  }

  /**
   * Déselectionne le backup dans la liste déroulante de la popin
   * @param backup
   */
  unselectBackup() {
    this.backups.map((x) => {
      x.selected = false
    })
  }

  /**
   * On lance une comparaison
   */
  onCompare() {
    this.showPicker = false
    if (this.compareOption === 1) {
      this.unselectBackup()
      if (!this.optionDateStart) {
        alert('Vous devez saisir une date de début !')
        return
      }

      if (!this.optionDateStop) {
        alert('Vous devez saisir une date de fin !')
        return
      }

      let rangeTitle = `${this.getRealValue(
        this.optionDateStart
      )} - ${this.getRealValue(this.optionDateStop)}`

      this.createdTitle = rangeTitle

      this.backupSettingsService
        .addOrUpdate(rangeTitle, BACKUP_SETTING_COMPARE, {
          dateStart: this.optionDateStart,
          dateStop: this.optionDateStop,
        })
        .then(() => this.onLoadComparaisons())

      this.kpiService.register(CALCULATOR_OPEN_CONMPARAISON_RANGE, rangeTitle)
    } else {
      const backupSelected = this.backups.find((b) => b.selected)
      if (!backupSelected) {
        alert('Vous devez saisir un référentiel de comparaison !')
        return
      }
      if (backupSelected.type === 'GREFFE')
        this.categorySelected = this.FONCTIONNAIRES
      else this.categorySelected = this.MAGISTRATS

      this.backupSettingsService
        .addOrUpdate(backupSelected.label, BACKUP_SETTING_COMPARE, {
          referentielId: backupSelected.id,
        })
        .then(() => this.onLoadComparaisons())

      this.kpiService.register(
        CALCULATOR_OPEN_CONMPARAISON_REFERENTIEL,
        backupSelected.id + ''
      )
    }

    this.onLoadCompare()
    this.location.replaceState('/cockpit')
  }

  /**
   * Comparaison des données back
   */
  async onLoadCompare() {
    if (this.categorySelected && this.isLoading === false) {
      this.onEdit = false
      const actualRangeString = `${this.getRealValue(
        this.dateStart
      )} - ${this.getRealValue(this.dateStop)}`
      const list: AnalyticsLine[] = []
      const value1TempsMoyen = (this.datasFilted || []).map(
        (d) => d.magRealTimePerCase
      )
      const stringValue1TempsMoyen = (value1TempsMoyen || []).map((d) =>
        d === null
          ? 'N/R'
          : `${this.getHours(d) || 0}h${this.getMinutes(d) || 0} `
      )

      const value1DTES = (this.datasFilted || []).map((d) => d.realDTESInMonths)
      const value1TauxCouverture = (this.datasFilted || []).map(
        (d) => d.realCoverage
      )
      const value1Sorties = (this.datasFilted || []).map((d) =>
        d.totalOut ? Math.floor(d.totalOut) : d.totalOut
      )
      const value1Entrees = (this.datasFilted || []).map((d) =>
        d.totalIn ? Math.floor(d.totalIn) : d.totalIn
      )
      const value1Stock = (this.datasFilted || []).map((d) => d.lastStock)
      const value1ETPTSiege = (this.datasFilted || []).map((d) => d.etpMag)
      const value1ETPTGreffe = (this.datasFilted || []).map((d) => d.etpFon)
      const value1ETPTEam = (this.datasFilted || []).map((d) => d.etpCont)
      const getVariations = (
        tab2: any[],
        tab1: any[],
        isPercentComparaison = true
      ) =>
        tab2.map((d: any, index: number) => {
          if (d === null || tab1[index] === null) {
            return 'N/R'
          }

          if (d === 0 && tab1[index] === 0) {
            return 0
          }

          let percent = 0

          if (isPercentComparaison) {
            percent = this.fixDecimal(
              ((tab1[index] || 0) / (d || 0) - 1) * 100,
              10
            )
          } else {
            percent = Math.floor((tab1[index] || 0) * 100 - (d || 0) * 100)
          }

          if (percent === Infinity) {
            return 'N/A'
          }

          if (percent > 0) {
            return '+' + percent
          }

          return percent
        })

      if (this.compareOption === 1) {
        this.appService.appLoading.next(true)
        const resultCalcul = await this.calculatorService.filterList(
          this.categorySelected,
          this.lastCategorySelected === this.categorySelected
            ? this.selectedFonctionsIds
            : null,
          this.optionDateStart,
          this.optionDateStop,
          false
        )
        this.appService.appLoading.next(false)
        const nextRangeString = `${this.getRealValue(
          this.optionDateStart
        )} - ${this.getRealValue(this.optionDateStop)}`
        this.compareAtString = nextRangeString

        const value2DTES: (number | null)[] = (resultCalcul.list || []).map(
          (d: CalculatorInterface) => d.realDTESInMonths
        )
        const variationsDTES = getVariations(value2DTES, value1DTES)
        list.push({
          title: 'DTES',
          type: 'verticals-lines',
          description: 'de la période<br/>(calculé sur les 12 mois précédents)',
          lineMax:
            Math.max(
              ...value1DTES.map((m) => m || 0),
              ...value2DTES.map((m) => m || 0)
            ) * 1.1,
          values: value1DTES.map((v, index) => [
            value2DTES[index] || 0,
            v || 0,
          ]),
          variations: [
            {
              label: 'Variation',
              values: variationsDTES,
              subTitle: '%',
              showArrow: true,
            },
            { label: nextRangeString, values: value2DTES, subTitle: 'mois' },
            { label: actualRangeString, values: value1DTES, subTitle: 'mois' },
          ],
        })

        const value2TempsMoyen: (number | null)[] = (
          resultCalcul.list || []
        ).map((d: CalculatorInterface) => d.magRealTimePerCase)
        const stringValue2TempsMoyen = (value2TempsMoyen || []).map((d) =>
          d === null
            ? 'N/R'
            : `${this.getHours(d) || 0}h${this.getMinutes(d) || 0} `
        )
        const variationsTempsMoyen = getVariations(
          value2TempsMoyen,
          value1TempsMoyen
        )
        list.push({
          title: 'Temps moyen',
          type: 'verticals-lines',
          description: 'sur la période',
          lineMax:
            Math.max(
              ...value1TempsMoyen.map((m) => m || 0),
              ...value2TempsMoyen.map((m) => m || 0)
            ) * 1.1,
          values: value1TempsMoyen.map((v, index) => [
            value2TempsMoyen[index] || 0,
            v || 0,
          ]),
          variations: [
            {
              label: 'Variation',
              values: variationsTempsMoyen,
              subTitle: '%',
              showArrow: true,
            },
            {
              label: nextRangeString,
              values: stringValue2TempsMoyen,
              subTitle: 'heures',
            },
            {
              label: actualRangeString,
              values: stringValue1TempsMoyen,
              subTitle: 'heures',
            },
          ],
        })

        const value2TauxCouverture: (number | null)[] = (
          resultCalcul.list || []
        ).map((d: CalculatorInterface) => d.realCoverage)
        const variationsCouverture = getVariations(
          value2TauxCouverture,
          value1TauxCouverture,
          false
        )
        list.push({
          title: 'Taux de couverture',
          type: 'progress',
          description: 'moyen sur la période',
          lineMax: 0,
          values: value1TauxCouverture.map((v, index) => [
            Math.floor((value1TauxCouverture[index] || 0) * 100),
            v === null ? null : Math.floor((v || 0) * 100),
          ]),
          variations: [
            {
              label: 'Variation',
              values: variationsCouverture,
              subTitle: 'pts',
              showArrow: true,
            },
            {
              label: nextRangeString,
              values: value2TauxCouverture.map((t) =>
                t === null ? 'N/R' : Math.floor(t * 100) + ' %'
              ),
            },
            {
              label: actualRangeString,
              values: value1TauxCouverture.map((t) =>
                t === null ? 'N/R' : Math.floor(t * 100) + ' %'
              ),
            },
          ],
        })

        const value2Stock: (number | null)[] = (resultCalcul.list || []).map(
          (d: CalculatorInterface) => d.lastStock
        )
        const variationsStock = getVariations(value2Stock, value1Stock)
        list.push({
          title: 'Stock',
          type: 'verticals-lines',
          description: 'sur la période',
          lineMax:
            Math.max(
              ...value1Stock.map((m) => m || 0),
              ...value2Stock.map((m) => m || 0)
            ) * 1.1,
          values: value1Stock.map((v, index) => [
            value2Stock[index] || 0,
            v || 0,
          ]),
          variations: [
            {
              label: 'Variation',
              values: variationsStock,
              subTitle: '%',
              showArrow: true,
            },
            { label: nextRangeString, values: value2Stock },
            { label: actualRangeString, values: value1Stock },
          ],
        })

        const value2Entrees: (number | null)[] = (resultCalcul.list || []).map(
          (d: CalculatorInterface) =>
            d.totalIn ? Math.floor(d.totalIn) : d.totalIn
        )
        const variationsEntrees = getVariations(value2Entrees, value1Entrees)
        list.push({
          title: 'Entrées',
          type: 'verticals-lines',
          description: 'moyennes<br/>sur la période',
          lineMax:
            Math.max(
              ...value1Entrees.map((m) => m || 0),
              ...value2Entrees.map((m) => m || 0)
            ) * 1.1,
          values: value1Entrees.map((v, index) => [
            value2Entrees[index] || 0,
            v || 0,
          ]),
          variations: [
            {
              label: 'Variation',
              values: variationsEntrees,
              subTitle: '%',
              showArrow: true,
            },
            { label: nextRangeString, values: value2Entrees },
            { label: actualRangeString, values: value1Entrees },
          ],
        })

        const value2Sorties: (number | null)[] = (resultCalcul.list || []).map(
          (d: CalculatorInterface) =>
            d.totalOut ? Math.floor(d.totalOut) : d.totalOut
        )
        const variationsSorties = getVariations(value2Sorties, value1Sorties)
        list.push({
          title: 'Sorties',
          type: 'verticals-lines',
          description: 'moyennes<br/>sur la période',
          lineMax:
            Math.max(
              ...value1Sorties.map((m) => m || 0),
              ...value2Sorties.map((m) => m || 0)
            ) * 1.1,
          values: value1Sorties.map((v, index) => [
            value2Sorties[index] || 0,
            v || 0,
          ]),
          variations: [
            {
              label: 'Variation',
              values: variationsSorties,
              subTitle: '%',
              showArrow: true,
            },
            { label: nextRangeString, values: value2Sorties },
            { label: actualRangeString, values: value1Sorties },
          ],
        })

        if (this.canViewMagistrat) {
          const value2ETPTSiege: (number | null)[] = (
            resultCalcul.list || []
          ).map((d: CalculatorInterface) => d.etpMag)
          const variationsETPTSiege = getVariations(
            value2ETPTSiege,
            value1ETPTSiege
          )
          list.push({
            title: 'ETPT Siège',
            type: 'verticals-lines',
            description: '-',
            lineMax:
              Math.max(
                ...value1ETPTSiege.map((m) => m || 0),
                ...value2ETPTSiege.map((m) => m || 0)
              ) * 1.1,
            values: value1ETPTSiege.map((v, index) => [
              value2ETPTSiege[index] || 0,
              v || 0,
            ]),
            variations: [
              {
                label: 'Variation',
                values: variationsETPTSiege,
                subTitle: '%',
                showArrow: true,
              },
              {
                label: nextRangeString,
                values: value2ETPTSiege,
                /*graph: {
                type: 'ETPTSiege',
                dateStart: new Date(this.optionDateStart || ''),
                dateStop: new Date(this.optionDateStop || ''),
                color: getCategoryColor('magistrat', 0.5),
              },*/
              },
              {
                label: actualRangeString,
                values: value1ETPTSiege,
                /*graph: {
                type: 'ETPTSiege',
                dateStart: new Date(this.dateStart || ''),
                dateStop: new Date(this.dateStop || ''),
                color: getCategoryColor('magistrat', 1),
              },*/
              },
            ],
          })
        }

        if (this.canViewGreffier) {
          const value2ETPTGreffe: (number | null)[] = (
            resultCalcul.list || []
          ).map((d: CalculatorInterface) => d.etpFon)
          const variationsETPTGreffe = getVariations(
            value2ETPTGreffe,
            value1ETPTGreffe
          )
          list.push({
            title: 'ETPT Greffe',
            type: 'verticals-lines',
            description: '-',
            lineMax:
              Math.max(
                ...value1ETPTGreffe.map((m) => m || 0),
                ...value2ETPTGreffe.map((m) => m || 0)
              ) * 1.1,
            values: value1ETPTGreffe.map((v, index) => [
              value2ETPTGreffe[index] || 0,
              v || 0,
            ]),
            variations: [
              {
                label: 'Variation',
                values: variationsETPTGreffe,
                subTitle: '%',
                showArrow: true,
              },
              {
                label: nextRangeString,
                values: value2ETPTGreffe,
                /*graph: {
                type: 'ETPTGreffe',
                dateStart: new Date(this.optionDateStart || ''),
                dateStop: new Date(this.optionDateStop || ''),
                color: getCategoryColor('greffe', 0.5),
              },*/
              },
              {
                label: actualRangeString,
                values: value1ETPTGreffe,
                /*graph: {
                type: 'ETPTGreffe',
                dateStart: new Date(this.dateStart || ''),
                dateStop: new Date(this.dateStop || ''),
                color: getCategoryColor('greffe', 1),
              },*/
              },
            ],
          })
        }

        if (this.canViewContractuel) {
          const value2ETPTEam: (number | null)[] = (
            resultCalcul.list || []
          ).map((d: CalculatorInterface) => d.etpCont)
          const variationsETPTEam = getVariations(value2ETPTEam, value1ETPTEam)
          list.push({
            title: 'ETPT EAM',
            type: 'verticals-lines',
            description: '-',
            lineMax:
              Math.max(
                ...value1ETPTEam.map((m) => m || 0),
                ...value2ETPTEam.map((m) => m || 0)
              ) * 1.1,
            values: value1ETPTEam.map((v, index) => [
              value2ETPTEam[index] || 0,
              v || 0,
            ]),
            variations: [
              {
                label: 'Variation',
                values: variationsETPTEam,
                subTitle: '%',
                showArrow: true,
              },
              {
                label: nextRangeString,
                values: value2ETPTEam,
                /*graph: {
                type: 'ETPTEam',
                dateStart: new Date(this.optionDateStart || ''),
                dateStop: new Date(this.optionDateStop || ''),
                color: getCategoryColor('eam', 0.5),
              },*/
              },
              {
                label: actualRangeString,
                values: value1ETPTEam,
                /*graph: {
                type: 'ETPTEam',
                dateStart: new Date(this.dateStart || ''),
                dateStop: new Date(this.dateStop || ''),
                color: getCategoryColor('eam', 1),
              },*/
              },
            ],
          })
        }
      } else {
        const refSelected = this.backups.find((b) => b.selected)
        if (!refSelected) {
          this.compareTemplates = null
          return
        }
        const refDetails = await this.contentieuxOptionsService.loadDetails(
          refSelected.id
        )
        this.compareAtString = refSelected.label

        const value2TempsMoyen = this.referentiel.map((ref) => {
          const findDetail = refDetails.find((r) => r.contentieux.id === ref.id)

          if (findDetail && findDetail.averageProcessingTime) {
            return findDetail.averageProcessingTime
          }

          return null
        })
        const stringValue2TempsMoyen = (value2TempsMoyen || []).map((d) =>
          d === null
            ? 'N/R'
            : `${this.getHours(d) || 0}h${this.getMinutes(d) || 0} `
        )
        const variationsTempsMoyen = getVariations(
          value2TempsMoyen,
          value1TempsMoyen
        )

        const nbDayByMonth =
          this.categorySelected === MAGISTRATS
            ? this.environment.nbDaysByMagistrat / 12
            : this.environment.nbDaysByFonctionnaire / 12
        const nbHoursPerDay =
          this.categorySelected === MAGISTRATS
            ? this.environment.nbHoursPerDayAndMagistrat
            : this.environment.nbHoursPerDayAndFonctionnaire
        const valETPT =
          this.categorySelected === MAGISTRATS
            ? [...value1ETPTSiege]
            : [...value1ETPTGreffe]
        const value2Sorties = [
          ...value1Sorties.map((v1, index) => {
            if (value2TempsMoyen[index] !== null && valETPT[index] !== null) {
              // nouvelle sorties = etpt * nb dossier
              // nb dossier = (nb hours * nb days) / temps moyen

              return Math.floor(
                ((valETPT[index] || 0) * nbHoursPerDay * nbDayByMonth) /
                  (value2TempsMoyen[index] || 0)
              )
            }

            return null
          }),
        ]

        list.push({
          title: 'Temps moyen',
          type: 'verticals-lines',
          description: 'de la période<br/>v/s<br/>temps moyen de référence',
          lineMax:
            Math.max(
              ...value1TempsMoyen.map((m) => m || 0),
              ...value2TempsMoyen.map((m) => m || 0)
            ) * 1.1,
          values: value1TempsMoyen.map((v, index) => [
            value2TempsMoyen[index] || 0,
            v || 0,
          ]),
          variations: [
            {
              label: 'Variation',
              values: variationsTempsMoyen,
              subTitle: '%',
              showArrow: true,
            },
            {
              label: refSelected.label,
              values: stringValue2TempsMoyen,
              subTitle: 'heures',
            },
            {
              label: actualRangeString,
              values: stringValue1TempsMoyen,
              subTitle: 'heures',
            },
          ],
        })

        const value2DTES = [
          ...value1DTES.map((v1, index) => {
            if (value2Sorties[index] !== null && value1Stock[index] !== null) {
              // DTES = stock / sorties

              return fixDecimal(
                (value1Stock[index] || 0) / (value2Sorties[index] || 0),
                10
              )
            }

            return null
          }),
        ]
        const variationsDTES = getVariations(value2DTES, value1DTES)
        list.push({
          title: 'DTES',
          type: 'verticals-lines',
          description:
            'de la période<br/>v/s<br/>DTES possible<br/><br/>(calculé sur les 12 mois précédents)',
          lineMax:
            Math.max(
              ...value1DTES.map((m) => m || 0),
              ...value2DTES.map((m) => m || 0)
            ) * 1.1,
          values: value1DTES.map((v, index) => [
            value2DTES[index] || 0,
            v || 0,
          ]),
          variations: [
            {
              label: 'Variation',
              values: variationsDTES,
              subTitle: '%',
              showArrow: true,
            },
            { label: refSelected.label, values: value2DTES, subTitle: 'mois' },
            { label: actualRangeString, values: value1DTES, subTitle: 'mois' },
          ],
        })

        const value2TauxCouverture = [
          ...value1TauxCouverture.map((v1, index) => {
            if (
              value2Sorties[index] !== null &&
              value1Entrees[index] !== null
            ) {
              // Taux de couverture = sorties / entrees

              return fixDecimal(
                (value2Sorties[index] || 0) / (value1Entrees[index] || 0),
                10
              )
            }

            return null
          }),
        ]

        const variationsCouverture = getVariations(
          value2TauxCouverture,
          value1TauxCouverture,
          false
        )
        list.push({
          title: 'Taux de couverture',
          type: 'progress',
          description: 'de la période<br/>v/s<br/>taux de couverture possible',
          lineMax: 0,
          values: value1TauxCouverture.map((v, index) => [
            Math.floor((value1TauxCouverture[index] || 0) * 100),
            v === null ? null : Math.floor((v || 0) * 100),
          ]),
          variations: [
            {
              label: 'Variation',
              values: variationsCouverture,
              subTitle: 'pts',
              showArrow: true,
            },
            {
              label: refSelected.label,
              values: value2TauxCouverture.map((t) =>
                t === null ? 'N/R' : Math.floor(t * 100) + ' %'
              ),
            },
            {
              label: actualRangeString,
              values: value1TauxCouverture.map((t) =>
                t === null ? 'N/R' : Math.floor(t * 100) + ' %'
              ),
            },
          ],
        })
        const variationsSorties = getVariations(value2Sorties, value1Sorties)
        list.push({
          title: 'Sorties',
          type: 'verticals-lines',
          description: 'de la période<br/>v/s<br/>sorties mensuelles possibles',
          lineMax:
            Math.max(
              ...value1Sorties.map((m) => m || 0),
              ...value2Sorties.map((m) => m || 0)
            ) * 1.1,
          values: value1Sorties.map((v, index) => [
            value2Sorties[index] || 0,
            v || 0,
          ]),
          variations: [
            {
              label: 'Variation',
              values: variationsSorties,
              subTitle: '%',
              showArrow: true,
            },
            { label: refSelected.label, values: value2Sorties },
            { label: actualRangeString, values: value1Sorties },
          ],
        })
      }

      this.compareTemplates = list
    }
    this.appService.notification('Les données du cockpit ont été mis à jour !')
  }

  getHours(value: number) {
    return Math.floor(value)
  }

  getMinutes(value: number) {
    return (Math.floor((value - Math.floor(value)) * 60) + '').padStart(2, '0')
  }

  /** Retourne la derniere date de maj si elle existe ou date de creation */
  getLastDate(backup: BackupInterface) {
    if (backup.update !== null) return backup.update.date
    else return backup.date
  }

  /**
   * Switch page
   */
  goToCreateRef() {
    this.router.navigate([
      '/temps-moyens',
      {
        datestart: this.dateStart,
        datestop: this.dateStop,
        category: this.categorySelected,
      },
    ])
  }

  /**
   * Filte la liste des backups à l'affichage
   */
  filterBackupsByCategory() {
    if (this.categorySelected === 'magistrats')
      this.filteredBackups = this.backups.filter((r) => r.type === 'SIEGE')
    else this.filteredBackups = this.backups.filter((r) => r.type === 'GREFFE')
  }

  /**
   * Drop down deselection
   */
  unselectTemplate() {
    this.showPicker = false
    this.compareTemplates = null
    this.referentiels.map((x) => {
      x.selected = false
    })
  }

  /**
   * Envoie d'une log lors de l'ouverture de la vue graphique
   */
  logChartView() {
    this.kpiService.register(CALCULATOR_OPEN_CHARTS_VIEW, '')
  }

  filterReferentiels(referentiels: any[]) {
    let refsList = referentiels.reduce((previous, current) => {
      if (current.datas && current.datas && current.datas.referentielId) {
        const bup = this.backups.find(
          (b) => b.id === current.datas.referentielId
        )
        if (bup && bup.type) {
          if (
            this.categorySelected === this.MAGISTRATS &&
            bup.type !== 'SIEGE'
          ) {
            return previous
          } else if (
            this.categorySelected === this.FONCTIONNAIRES &&
            bup.type !== 'GREFFE'
          ) {
            return previous
          }
        }
      }

      previous.push(current)
      return previous
    }, [])

    if (refsList.length === 0) {
      const start = month(this.calculatorService.dateStart.getValue(), -12)
      const stop = month(this.calculatorService.dateStop.getValue(), -12)
      refsList.push({
        label: `${this.getRealValue(start)} - ${this.getRealValue(stop)}`,
        selected: false,
        isLocked: true,
        dateStop: stop,
        dateStart: start,
        datas: {
          dateStop: stop,
          dateStart: start,
        },
      })
    }

    return refsList
  }
}
