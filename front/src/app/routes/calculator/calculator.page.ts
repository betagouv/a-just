import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { MatCalendarCellClassFunction } from '@angular/material/datepicker'
import * as _ from 'lodash'
import { orderBy } from 'lodash'
import { AnalyticsLine, TemplateAnalyticsComponent } from './template-analytics/template-analytics.component'
import { ActivatedRoute, Router } from '@angular/router'
import { CommonModule, Location } from '@angular/common'
import { BehaviorSubject } from 'rxjs'
import { WrapperComponent } from '../../components/wrapper/wrapper.component'
import { dataInterface, SelectComponent } from '../../components/select/select.component'
import { DateSelectComponent } from '../../components/date-select/date-select.component'
import { TooltipsComponent } from '../../components/tooltips/tooltips.component'
import { ReferentielCalculatorComponent } from './referentiel-calculator/referentiel-calculator.component'
import { PopupComponent } from '../../components/popup/popup.component'
import { FormsModule } from '@angular/forms'
import { MainClass } from '../../libs/main-class'
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel'
import { CalculatorInterface } from '../../interfaces/calculator'
import { DocumentationInterface } from '../../interfaces/documentation'
import { sleep } from '../../utils'
import { BackupInterface } from '../../interfaces/backup'
import { BackupSettingInterface } from '../../interfaces/backup-setting'
import { HumanResourceService } from '../../services/human-resource/human-resource.service'
import { CalculatorService } from '../../services/calculator/calculator.service'
import { ReferentielService } from '../../services/referentiel/referentiel.service'
import { ContentieuxOptionsService } from '../../services/contentieux-options/contentieux-options.service'
import { ActivitiesService } from '../../services/activities/activities.service'
import { UserService } from '../../services/user/user.service'
import { BackupSettingsService } from '../../services/backup-settings/backup-settings.service'
import { AppService } from '../../services/app/app.service'
import { KPIService } from '../../services/kpi/kpi.service'
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from '../../utils/user'
import { getTime, isDateBiggerThan, month } from '../../utils/dates'
import { HRCategoryInterface } from '../../interfaces/hr-category'
import { HRFonctionInterface } from '../../interfaces/hr-fonction'
import { BACKUP_SETTING_COMPARE } from '../../constants/backup-settings'
import { NB_MAX_CUSTOM_COMPARAISONS } from '../../constants/calculator'
import {
  CALCULATOR_OPEN_CHARTS_VIEW,
  CALCULATOR_OPEN_CONMPARAISON_RANGE,
  CALCULATOR_OPEN_CONMPARAISON_REFERENTIEL,
  CALCULATOR_SELECT_GREFFE,
  EXECUTE_CALCULATOR_CHANGE_DATE,
} from '../../constants/log-codes'
import { MAGISTRATS } from '../../constants/category'
import { fixDecimal } from '../../utils/numbers'
import { ViewAnalyticsComponent } from './view-analytics/view-analytics.component'
import { PopinGraphsDetailsComponent } from './popin-graphs-details/popin-graphs-details.component'
import { NB_DAYS_BY_FONCTIONNAIRE, NB_DAYS_BY_MAGISTRAT, NB_HOURS_PER_DAY_AND_FONCTIONNAIRE, NB_HOURS_PER_DAY_AND_MAGISTRAT } from '../../constants/referentiel'
import { IntroJSStep } from '../../services/tour/tour.service'

/**
 * Page du calculateur
 */

@Component({
  standalone: true,
  imports: [
    WrapperComponent,
    CommonModule,
    SelectComponent,
    DateSelectComponent,
    TooltipsComponent,
    ReferentielCalculatorComponent,
    PopupComponent,
    TemplateAnalyticsComponent,
    FormsModule,
    ViewAnalyticsComponent,
    PopinGraphsDetailsComponent,
  ],
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage extends MainClass implements OnDestroy, OnInit, AfterViewInit {
  humanResourceService = inject(HumanResourceService)
  calculatorService = inject(CalculatorService)
  referentielService = inject(ReferentielService)
  contentieuxOptionsService = inject(ContentieuxOptionsService)
  activitiesService = inject(ActivitiesService)
  userService = inject(UserService)
  backupSettingsService = inject(BackupSettingsService)
  router = inject(Router)
  appService = inject(AppService)
  route = inject(ActivatedRoute)
  location = inject(Location)
  kpiService = inject(KPIService)
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
   * Liste des référentiels filtrés
   */
  _filteredReferentiels: any[] = []
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
  sortBy: { type: string; up: boolean | null } = { type: '', up: null }
  /**
   * Liste des lignes du calculateurs venant du back
   */
  datas: CalculatorInterface[] = []
  /**
   * Filtre des lignes du calculateur visible
   */
  datasFilted: CalculatorInterface[] = []
  /**
   * Données filtrées dédiées aux analytics
   */
  datasAnalytics: CalculatorInterface[] = []
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
    path: this.userService.isCa()
      ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/quest-ce-que-cest-1'
      : 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/calculateur/quest-ce-que-cest',
    printSubTitle: true,
  }
  /**
   * Documentation list
   */
  docLinks: string[] = [
    this.userService.isCa()
      ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/les-donnees-brutes'
      : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/cockpit/les-donnees-brutes',
    this.userService.isCa()
      ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/les-vues-graphiques'
      : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/cockpit/les-vues-graphiques',
    this.userService.isCa()
      ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/comparer-son-activite'
      : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/cockpit/comparer-son-activite',
  ]
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
  introSteps: IntroJSStep[] = this.userService.isTJ()
    ? [
        {
          target: '#wrapper-contener',
          title: 'À quoi sert le cockpit ?',
          intro:
            '<p>Le cockpit vous permet de visualiser en un coup d’œil quelques <b>indicateurs simples, calculés à partir des données d’effectifs et d’activité renseignées dans A-JUST</b> et, si vous le souhaitez, de les <b>comparer à une autre période ou à un référentiel </b>que vous auriez renseigné.</p><p>Des visualisations graphiques vous sont également proposées.</p><video controls class="intro-js-video small-video"><source src="/assets/videos/decouvrez-le-cockpit.mp4" type="video/mp4" /></video>',
        },
        {
          target: '.sub-main-header',
          title: 'Affinez votre sélection',
          intro:
            "<p>Vous pouvez sélectionner la <b>catégorie d'agents</b> souhaitée, restreindre si besoin les calculs à <b>une ou plusieurs fonctions</b> et exporter ces restitutions en PDF pour les enregistrer et/ou les partager.</p><p>Vous pouvez choisir la période, certaines données affichées étant des <b>valeurs moyennes</b>, elles seront d’autant plus représentatives que la période sélectionnée sera longue.</p>",
        },
        {
          target: '.switch-tab .brut',
          title: 'Les données brutes',
          intro:
            '<p>Cette section permet de visualiser deux indicateurs simples, sur la période, calculés pour chaque contentieux et sous contentieux, à partir des données renseignées dans A-JUST :</p><ul><li>le taux de couverture moyen</li><li>et le DTES (Délai Théorique d’Écoulement du Stock) à la date de fin de période.</li></ul><p>Vous retrouvez également :</p><ul><li>Les <b>entrées et sorties</b> moyennes mensuelles</li><li>Le <b>stock</b> à la fin de la période choisie</li><li>Les <b>ETPT</b> affectés à chaque contentieux</li><li><b>Les temps moyens par dossier</b> (siège ou greffe selon votre sélection), clé théorique de projection dans le futur calculée à la fin de la période sur les 12 mois précédents.</li></ul>',
          beforeLoad: async (intro: any) => {
            const itemToClick = document.querySelector('.switch-tab .brut')
            if (itemToClick) {
              // @ts-ignore
              itemToClick.click()
              await sleep(200)
            }
          },
        },
        {
          target: '.switch-tab .analytique',
          title: 'Les graphiques',
          intro:
            '<p>Pour chaque contentieux, une représentation visuelle des indicateurs, comprenant le détail des données et leurs évolutions entre le début et la fin de la période.</p>',
          beforeLoad: async (intro: any) => {
            const itemToClick = document.querySelector('.switch-tab .analytique')
            if (itemToClick) {
              // @ts-ignore
              itemToClick.click()
              await sleep(200)
            }
          },
        },
        {
          target: '.compare', //.drop-down',
          title: 'Comparez votre juridiction',
          intro:
            '<p>Vous pouvez choisir de mettre en perspective les indicateurs de la période choisie avec ceux d’une autre période ou d’un référentiel de temps afin de visualiser les évolutions ou les taux de couverture et DTES de votre juridiction  susceptibles de résulter de temps moyens de comparaison renseignés.</p><p>Cliquez ici pour <b>créer ou importer un référentiel de temps moyen dans A-JUST</b>.</p><video controls class="intro-js-video small-video"><source src="/assets/videos/fonctionnalites-de-comparaison-dans-le-cockpit.mp4" type="video/mp4" /></video>',
          /*beforeLoad: async (intro: any) => {
        intro._introItems[4].position = '';
        const itemToClick: any = document.querySelector('button.compare');
        if (itemToClick) {
          itemToClick.click();
          await sleep(200);
          intro.refresh();
          console.log(intro);
        }
      },*/
        },
      ]
    : [
        {
          target: '#wrapper-contener',
          title: 'À quoi sert le cockpit ?',
          intro:
            '<p>Le cockpit vous permet de visualiser en un coup d’œil quelques <b>indicateurs simples, calculés à partir des données d’effectifs et d’activité renseignées dans A-JUST</b> et, si vous le souhaitez, de les <b>comparer à une autre période ou à un référentiel </b>que vous auriez renseigné.</p><p>Des visualisations graphiques vous sont également proposées.</p><video controls class="intro-js-video small-video"><source src="/assets/videos/decouvrez-le-cockpit-a-just-ca-mp4-480p.mp4" type="video/mp4" /></video>',
        },
        {
          target: '.sub-main-header',
          title: 'Affinez votre sélection',
          intro:
            "<p>Vous pouvez sélectionner la <b>catégorie d'agents</b> souhaitée, restreindre si besoin les calculs à <b>une ou plusieurs fonctions</b> et exporter ces restitutions en PDF pour les enregistrer et/ou les partager.</p><p>Vous pouvez choisir la période, certaines données affichées étant des <b>valeurs moyennes</b>, elles seront d’autant plus représentatives que la période sélectionnée sera longue.</p>",
        },
        {
          target: '.switch-tab .brut',
          title: 'Les données brutes',
          intro:
            '<p>Cette section permet de visualiser deux indicateurs simples, sur la période, calculés pour chaque contentieux et sous contentieux, à partir des données renseignées dans A-JUST :</p><ul><li>le taux de couverture moyen</li><li>et le DTES (Délai Théorique d’Écoulement du Stock) à la date de fin de période.</li></ul><p>Vous retrouvez également :</p><ul><li>Les <b>entrées et sorties</b> moyennes mensuelles</li><li>Le <b>stock</b> à la fin de la période choisie</li><li>Les <b>ETPT</b> affectés à chaque contentieux</li><li><b>Les temps moyens par dossier</b> (siège ou greffe selon votre sélection), clé théorique de projection dans le futur calculée à la fin de la période sur les 12 mois précédents.</li></ul>',
          beforeLoad: async (intro: any) => {
            const itemToClick = document.querySelector('.switch-tab .brut')
            if (itemToClick) {
              // @ts-ignore
              itemToClick.click()
              await sleep(200)
            }
          },
        },
        {
          target: '.switch-tab .analytique',
          title: 'Les graphiques',
          intro:
            '<p>Pour chaque contentieux, une représentation visuelle des indicateurs, comprenant le détail des données et leurs évolutions entre le début et la fin de la période.</p>',
          beforeLoad: async (intro: any) => {
            const itemToClick = document.querySelector('.switch-tab .analytique')
            if (itemToClick) {
              // @ts-ignore
              itemToClick.click()
              await sleep(200)
            }
          },
        },
        {
          target: '.compare', //.drop-down',
          title: 'Comparez votre juridiction',
          intro:
            '<p>Vous pouvez choisir de mettre en perspective les indicateurs de la période choisie avec ceux d’une autre période ou d’un référentiel de temps afin de visualiser les évolutions ou les taux de couverture et DTES de votre juridiction  susceptibles de résulter de temps moyens de comparaison renseignés.</p><p>Cliquez ici pour <b>créer ou importer un référentiel de temps moyen dans A-JUST</b>.</p><video controls class="intro-js-video small-video"><source src="/assets/videos/fonction-de-comparaison-du-cockpit-3-mp4-480p.mp4" type="video/mp4" /></video>',
          /*beforeLoad: async (intro: any) => {
        intro._introItems[4].position = '';
        const itemToClick: any = document.querySelector('button.compare');
        if (itemToClick) {
          itemToClick.click();
          await sleep(200);
          intro.refresh();
          console.log(intro);
        }
      },*/
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
   * Date minimum selectionnable
   */
  minDateSelectable: Date = new Date()
  /**
   * Detect if last month is loading
   */
  checkLastMonthLoading: boolean = false
  /**
   * Menu déroulant export
   */
  dropdownExport: boolean = false
  /**
   * Ouvrir popup name ref
   */
  promptRef: boolean = false
  /**
   * Ouvrir popup name ref
   */
  displayRouterRef: boolean = false
  /**
   * Placeholder referentiel name
   */
  defaultRefName: string = ''
  /**
   * Indique si un référentiel vient d'être créé par sauvegarde des temps affichés
   */
  createSaveReferentiel: boolean = false
  /**
   * Nombre de jours travaillé par magistrat
   */
  nbDaysByMagistrat: number = NB_DAYS_BY_MAGISTRAT
  /**
   * Nombre de jours travaillé par fonctionnaire
   */
  nbDaysByFonctionnaire: number = NB_DAYS_BY_FONCTIONNAIRE
  /**
   * Nombre d'heures travaillé par jour par magistrat
   */
  nbHoursPerDayAndMagistrat: number = NB_HOURS_PER_DAY_AND_MAGISTRAT
  /**
   * Nombre d'heures travaillé par jour par fonctionnaire
   */
  nbHoursPerDayAndFonctionnaire: number = NB_HOURS_PER_DAY_AND_FONCTIONNAIRE
  /** Date max cockpit */
  limitDate = this.addMonthsToDate(new Date(), 11)

  /**
   * Constructeur
   */
  constructor() {
    super()

    this.watch(
      this.humanResourceService.backupId.subscribe((backupId) => {
        if (backupId !== null) {
          this.onLoad()
        }
      }),
    )

    this.minDateSelectable = this.userService.isCa() ? new Date(2022, 0, 1) : new Date(2021, 0, 1)
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnInit() {
    if (!this.userService.canViewRCockpit()) {
      this.userService.redirectToHome()
    }

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
          alert("Vos droits ne vous permettent pas d'exécuter un calcul, veuillez contacter un administrateur.")
        }
        this.calculatorService.categorySelected.next(this.categorySelected)
      }),
    )

    this.watch(
      this.contentieuxOptionsService.backupId.subscribe(() => {
        if (this.createSaveReferentiel) {
          this.createSaveReferentiel = false
        } else this.onLoad()
      }),
    )
    this.watch(
      this.calculatorService.dateStart.subscribe((date) => {
        this.dateStart = date
        if (date === null) {
          this.onCheckLastMonth()
        } else {
          this.onLoad()
        }
      }),
    )
    this.watch(
      this.calculatorService.dateStop.subscribe((date) => {
        this.dateStop = date
        this.onLoad()
      }),
    )
    this.watch(
      this.calculatorService.referentielIds.subscribe((refs) => {
        this.referentielIds = refs
        this.onLoad()
      }),
    )

    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter((r) => this.referentielService.idsIndispo.indexOf(r.id) === -1)

        if (this.referentielIds.length === 0) {
          this.calculatorService.referentielIds.next(this.referentiel.map((r) => r.id))
        }

        this.onCheckLastMonth()
      }),
    )

    // Chargement des référentiels
    this.watch(
      this.contentieuxOptionsService.backups.subscribe((b) => {
        this.backups = orderBy(
          b,
          [
            (val) => {
              const date = val.update?.date || val.date
              return getTime(date)
            },
          ],
          ['desc'],
        )
      }),
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
      }),
    )
  }

  /**
   * Chargement de la liste des fonctions
   */
  loadFunctions() {
    let cat = this.categorySelected?.toUpperCase() === 'FONCTIONNAIRES' ? 'Greffe' : 'Magistrat'

    const findCategory = this.humanResourceService.categories.getValue().find((c: HRCategoryInterface) => c.label === cat) || null

    this.fonctions = this.humanResourceService.fonctions
      .getValue()
      .filter((v) => v.categoryId === findCategory?.id)
      .map(
        (f: HRFonctionInterface) =>
          ({
            id: f.id,
            value: f.code,
          }) as dataInterface,
      )
    this.lastCategorySelected = this.categorySelected
    this.selectedFonctionsIds = this.fonctions.map((a) => a.id)
    this.calculatorService.selectedFonctionsIds.next(this.selectedFonctionsIds)
  }

  ngAfterViewInit() {
    this.watch(
      this.route.params.subscribe((params) => {
        if (params['datestart'] && params['datestop']) {
          this.dateStart = new Date(this.route.snapshot.params['datestart'])
          this.calculatorService.dateStart.next(this.dateStart)
          this.dateStop = new Date(this.route.snapshot.params['datestop'])
          this.calculatorService.dateStop.next(this.dateStop)
          this.changeCategorySelected(this.route.snapshot.params['category'] === 'magistrats' ? this.MAGISTRATS : this.FONCTIONNAIRES)
          this.tabSelected = 1
          this.onEdit = true
          this.location.replaceState('/cockpit')
          this.filterBackupsByCategory()
        }
      }),
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
  async onCheckLastMonth(force = false) {
    if (((!force && this.calculatorService.dateStart.getValue() === null) || force) && !this.checkLastMonthLoading) {
      this.checkLastMonthLoading = true
      return this.activitiesService.getLastMonthActivities().then((date) => {
        date = new Date(date || null)
        const max = month(date, 0, 'lastday')
        this.maxDateSelectionDate = max

        const min = month(max, -11)
        this.calculatorService.dateStart.next(min)
        this.calculatorService.dateStop.next(max)
        this.checkLastMonthLoading = false
        this.onLoadComparaisons()
      })
    }
  }

  /**
   * Charge la liste des contentieux de comparaison
   */
  onLoadComparaisons(selectedByLabel: string | null = null) {
    this.backupSettingsService.list([BACKUP_SETTING_COMPARE]).then((l) => {
      // clean list from brokens saves
      l = l.filter((item) => item.datas && (item.datas.dateStart || item.datas.referentielId))

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
            selected: l.datas && l.datas.referentielId === preselectedRefId ? true : false,
            isLocked: false,
            datas: l.datas,
          })
        })
      }

      if (selectedByLabel) {
        refs = refs.map((i) => ({
          ...i,
          selected: i.label === selectedByLabel,
        }))
      }

      for (let i = NB_MAX_CUSTOM_COMPARAISONS; i < l.length; i++) {
        this.backupSettingsService.removeSetting(l[i].id)
      }

      this.referentiels = [...refs]
      this.backupSettingSaved = l

      this.updateFilteredReferentiels()
    })
  }

  /**
   * Remove setting saved
   * @param refSettingLabel
   */
  onRemoveSetting(refSettingLabel: string) {
    const backupSettingSaved = this.backupSettingSaved.find((b) => b.label === refSettingLabel)
    if (backupSettingSaved) {
      this.backupSettingsService.removeSetting(backupSettingSaved.id).then(() => this.onLoadComparaisons())
    }
  }

  /**
   * Chargement des données back
   */
  onLoad(loadDetail = true, changedCategory = false) {
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
              this.lastCategorySelected === this.categorySelected && !changedCategory ? this.selectedFonctionsIds : null,
              this.dateStart,
              this.dateStop,
              true,
            )
            .then(({ list, fonctions }) => {
              this.appService.appLoading.next(false)
              if (this.lastCategorySelected !== this.categorySelected) {
                this.fonctions = fonctions.map((f: HRFonctionInterface) => ({
                  id: f.id,
                  value: f.code,
                }))
                this.selectedFonctionsIds = fonctions.map((f: HRFonctionInterface) => f.id)
                this.calculatorService.selectedFonctionsIds.next(this.selectedFonctionsIds)
              }
              this.formatDatas(list)
              this.isLoading = false
              this.lastCategorySelected = this.categorySelected

              if (this.firstLoading === false && this.location.path() === '/cockpit') {
                this.appService.notification('Les données du cockpit ont été mis à jour !')
              }
              this.firstLoading = false
              this.onLoadComparaisons()
            })
            .catch(() => {
              this.isLoading = false
            })
        }
      },
      this.firstLoading ? 0 : 1500,
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
    this.datasFilted = [...this.datas]
    this.datasAnalytics = [...this.datas]
    this.filtredDatas()
  }

  /**
   * Trier les datas en fonction d'un trie
   */
  filtredDatas(up: boolean | null = null) {
    let list = this.datas
    if (this.sortBy) {
      let sort = this.sortBy.type
      if (this.sortBy.type === 'magRealTimePerCase' && this.categorySelected !== 'magistrats') {
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
        [up ? 'asc' : 'desc'],
      )
    }

    if (this.tabSelected === 0) {
      this.datasFilted = list
    } else {
      this.datasAnalytics = list
    }
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
    if (this.sortBy.type !== type) {
      this.sortBy.up = true
      this.sortBy.type = type
    } else if (this.sortBy.up) {
      this.sortBy.up = false
    } else if (this.sortBy.up === false) {
      this.sortBy.up = null
      this.sortBy.type = ''
    }
    this.filtredDatas(this.sortBy.up)
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
    this.onLoad(false, true)
    if (this.categorySelected === this.FONCTIONNAIRES) this.kpiService.register(CALCULATOR_SELECT_GREFFE, '')
    this.updateFilteredReferentiels()
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
        `Cockpit_par ${this.userService.user.getValue()!.firstName}_${this.userService.user.getValue()!.lastName!}_le ${new Date().toJSON().slice(0, 10)}.pdf`,
        false,
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
        if (counter < 3) tmpStr = tmpStr.length ? [tmpStr, find.value].join(', ') : find.value
        counter++
      }
    })
    if (counter > 4) tmpStr = tmpStr + ' et ' + (counter - 3) + ' autres'
    else if (counter === 4) tmpStr = tmpStr + ' et ' + (counter - 3) + ' autre de plus'

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
    this.referentiels = this.referentiels.map((x) => {
      x.selected = ref.label === x.label
      return x
    })
    ref.selected = true

    if (ref.datas) {
      if (ref.isLocked) {
        this.backupSettingsService.addOrUpdate(ref.label, BACKUP_SETTING_COMPARE, ref.datas).then(() => this.onLoadComparaisons(ref.label))
      }

      if (ref.datas.dateStart) {
        this.compareOption = 1
        this.optionDateStart = new Date(ref.datas.dateStart)
        this.optionDateStop = month(new Date(ref.datas.dateStop), 0, 'lastday')
        this.kpiService.register(CALCULATOR_OPEN_CONMPARAISON_RANGE, ref.label + '')
      } else if (ref.datas.referentielId) {
        this.compareOption = 2
        this.backups = this.backups.map((b) => ({
          ...b,
          selected: ref.datas.referentielId == b.id,
        }))
        this.kpiService.register(CALCULATOR_OPEN_CONMPARAISON_REFERENTIEL, ref.datas.referentielId + '')
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

      let rangeTitle = `${this.getRealValue(this.optionDateStart)} - ${this.getRealValue(this.optionDateStop)}`

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
      if (backupSelected.type === 'GREFFE') this.categorySelected = this.FONCTIONNAIRES
      else this.categorySelected = this.MAGISTRATS

      this.backupSettingsService
        .addOrUpdate(backupSelected.label, BACKUP_SETTING_COMPARE, {
          referentielId: backupSelected.id,
        })
        .then(() => this.onLoadComparaisons())

      this.kpiService.register(CALCULATOR_OPEN_CONMPARAISON_REFERENTIEL, backupSelected.id + '')
    }

    this.onLoadCompare()
    this.location.replaceState('/cockpit')
  }

  /**
   * Comparaison des données back
   */
  async onLoadCompare() {
    if (this.categorySelected && this.isLoading === false) {
      const datas = this.tabSelected === 0 ? this.datasFilted : this.datasAnalytics

      this.onEdit = false
      const actualRangeString = `${this.getRealValue(this.dateStart)} - ${this.getRealValue(this.dateStop)}`
      const list: AnalyticsLine[] = []
      const value1TempsMoyen = (datas || []).map((d) => (this.categorySelected === MAGISTRATS ? d.magRealTimePerCase : d.fonRealTimePerCase))
      const stringValue1TempsMoyen = (value1TempsMoyen || []).map((d) => (d === null ? 'N/R' : `${this.getHours(d) || 0}h${this.getMinutes(d) || 0} `))

      const value1DTES = (datas || []).map((d) => d.realDTESInMonths)
      const value1TauxCouverture = (datas || []).map((d) => d.realCoverage)
      const value1Sorties = (datas || []).map((d) => (d.totalOut ? Math.round(d.totalOut) : d.totalOut))
      const value1Entrees = (datas || []).map((d) => (d.totalIn ? Math.round(d.totalIn) : d.totalIn))
      const value1Stock = (datas || []).map((d) => d.lastStock)
      const value1ETPTSiege = (datas || []).map((d) => (d.etpMag ? this.round2(d.etpMag) : d.etpMag))
      const value1ETPTGreffe = (datas || []).map((d) => (d.etpFon ? this.round2(d.etpFon) : d.etpFon))
      const value1ETPTEam = (datas || []).map((d) => (d.etpCont ? this.round2(d.etpCont) : d.etpCont))
      const getVariations = (tab2: any[], tab1: any[], isPercentComparaison = true) =>
        tab2.map((d: any, index: number) => {
          if (d === null || tab1[index] === null || d === Infinity) {
            return 'N/R'
          }

          if (d === 0 && tab1[index] === 0) {
            return 0
          }

          let percent = 0

          if (isPercentComparaison) {
            percent = this.fixDecimal(((tab1[index] || 0) / (d || 0) - 1) * 100, 10)
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
          this.lastCategorySelected === this.categorySelected ? this.selectedFonctionsIds : null,
          this.optionDateStart,
          this.optionDateStop,
          false,
        )

        let dateEndIsPast = false
        if (!this.maxDateSelectionDate) {
          await this.onCheckLastMonth(true)
        }

        if (this.dateStop && this.maxDateSelectionDate) {
          dateEndIsPast = isDateBiggerThan(this.dateStop, this.maxDateSelectionDate, true)
        }
        if (!dateEndIsPast && this.optionDateStop && this.maxDateSelectionDate) {
          dateEndIsPast = isDateBiggerThan(this.optionDateStop, this.maxDateSelectionDate, true)
        }

        this.appService.appLoading.next(false)
        const nextRangeString = `${this.getRealValue(this.optionDateStart)} - ${this.getRealValue(this.optionDateStop)}`
        this.compareAtString = nextRangeString

        if (!dateEndIsPast) {
          const value2DTES: (number | null)[] = (resultCalcul.list || []).map((d: CalculatorInterface) => d.realDTESInMonths)
          const variationsDTES = getVariations(value2DTES, value1DTES)
          list.push({
            title: 'DTES',
            dataType: 'dtes',
            type: 'verticals-lines',
            description: 'de la période<br/>(calculé sur les 12 mois précédents)',
            lineMax: null,
            values: value1DTES.map((v, index) => [value2DTES[index] || 0, v || 0]),
            variations: [
              {
                label: 'Variation',
                values: variationsDTES,
                subTitle: '%',
                showArrow: true,
              },
              { label: nextRangeString, values: value2DTES, subTitle: 'mois' },
              {
                label: actualRangeString,
                values: value1DTES,
                subTitle: 'mois',
              },
            ],
          })
        }

        if (!dateEndIsPast) {
          const value2TempsMoyen: (number | null)[] = (resultCalcul.list || []).map((d: CalculatorInterface) =>
            this.categorySelected === MAGISTRATS ? d.magRealTimePerCase : d.fonRealTimePerCase,
          )
          const stringValue2TempsMoyen = (value2TempsMoyen || []).map((d) => (d === null ? 'N/R' : `${this.getHours(d) || 0}h${this.getMinutes(d) || 0} `))
          const variationsTempsMoyen = getVariations(value2TempsMoyen, value1TempsMoyen)
          list.push({
            title: 'Temps moyen',
            dataType: 'temps-moyen',
            type: 'verticals-lines',
            description: 'sur la période',
            lineMax: null,
            values: value1TempsMoyen.map((v, index) => [value2TempsMoyen[index] || 0, v || 0]),
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
        }

        if (!dateEndIsPast) {
          const value2TauxCouverture: (number | null)[] = (resultCalcul.list || []).map((d: CalculatorInterface) => d.realCoverage)
          const variationsCouverture = getVariations(value2TauxCouverture, value1TauxCouverture, false)
          list.push({
            title: 'Taux de couverture',
            dataType: 'taux-couverture',
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
                values: value2TauxCouverture.map((t) => (t === null ? 'N/R' : Math.floor(t * 100) + ' %')),
              },
              {
                label: actualRangeString,
                values: value1TauxCouverture.map((t) => (t === null ? 'N/R' : Math.floor(t * 100) + ' %')),
              },
            ],
          })
        }

        if (!dateEndIsPast) {
          const value2Stock: (number | null)[] = (resultCalcul.list || []).map((d: CalculatorInterface) => d.lastStock)
          const variationsStock = getVariations(value2Stock, value1Stock)
          list.push({
            title: 'Stock',
            dataType: 'stock',
            type: 'verticals-lines',
            description: 'en fin de période',
            lineMax: null,
            values: value1Stock.map((v, index) => [value2Stock[index] || 0, v || 0]),
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
        }

        if (!dateEndIsPast) {
          const value2Entrees: (number | null)[] = (resultCalcul.list || []).map((d: CalculatorInterface) => (d.totalIn ? Math.floor(d.totalIn) : d.totalIn))
          const variationsEntrees = getVariations(value2Entrees, value1Entrees)
          list.push({
            title: 'Entrées',
            dataType: 'entrees',
            type: 'verticals-lines',
            description: 'moyennes<br/>sur la période',
            lineMax: null,
            values: value1Entrees.map((v, index) => [value2Entrees[index] || 0, v || 0]),
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
        }

        if (!dateEndIsPast) {
          const value2Sorties: (number | null)[] = (resultCalcul.list || []).map((d: CalculatorInterface) => (d.totalOut ? Math.floor(d.totalOut) : d.totalOut))
          const variationsSorties = getVariations(value2Sorties, value1Sorties)
          list.push({
            title: 'Sorties',
            dataType: 'sorties',
            type: 'verticals-lines',
            description: 'moyennes<br/>sur la période',
            lineMax: null,
            values: value1Sorties.map((v, index) => [value2Sorties[index] || 0, v || 0]),
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
        }

        if (this.canViewMagistrat) {
          const value2ETPTSiege: (number | null)[] = (resultCalcul.list || []).map((d: CalculatorInterface) => (d.etpMag ? this.round2(d.etpMag) : d.etpMag))
          const variationsETPTSiege = getVariations(value2ETPTSiege, value1ETPTSiege)
          list.push({
            title: 'ETPT Siège',
            dataType: 'ETPTSiege',
            type: 'verticals-lines',
            description: 'moyens sur la période',
            lineMax: null,
            values: value1ETPTSiege.map((v, index) => [value2ETPTSiege[index] || 0, v || 0]),
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
          const value2ETPTGreffe: (number | null)[] = (resultCalcul.list || []).map((d: CalculatorInterface) => (d.etpFon ? this.round2(d.etpFon) : d.etpFon))
          const variationsETPTGreffe = getVariations(value2ETPTGreffe, value1ETPTGreffe)
          list.push({
            title: 'ETPT Greffe',
            dataType: 'ETPTGreffe',
            type: 'verticals-lines',
            description: 'moyens sur la période',
            lineMax: null,
            values: value1ETPTGreffe.map((v, index) => [value2ETPTGreffe[index] || 0, v || 0]),
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
          const value2ETPTEam: (number | null)[] = (resultCalcul.list || []).map((d: CalculatorInterface) => (d.etpCont ? this.round2(d.etpCont) : d.etpCont))
          const variationsETPTEam = getVariations(value2ETPTEam, value1ETPTEam)
          list.push({
            title: 'ETPT EAM',
            dataType: 'ETPTEam',
            type: 'verticals-lines',
            description: 'moyens sur la période',
            lineMax: null,
            values: value1ETPTEam.map((v, index) => [value2ETPTEam[index] || 0, v || 0]),
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
          if ([0, 1].includes(this.tabSelected)) {
            this.documentation.path = this.docLinks[this.tabSelected]
          }
          return
        }
        const refDetails = await this.contentieuxOptionsService.loadDetails(refSelected.id)
        this.compareAtString = refSelected.label

        const value2TempsMoyen = this.referentiel.map((ref) => {
          const findDetail = refDetails.find((r) => r.contentieux.id === ref.id)

          if (findDetail && findDetail.averageProcessingTime) {
            return findDetail.averageProcessingTime
          }

          return null
        })
        const stringValue2TempsMoyen = (value2TempsMoyen || []).map((d) => (d === null ? 'N/R' : `${this.getHours(d) || 0}h${this.getMinutes(d) || 0} `))
        const variationsTempsMoyen = getVariations(value2TempsMoyen, value1TempsMoyen)

        const nbDayByMonth = this.categorySelected === MAGISTRATS ? this.nbDaysByMagistrat / 12 : this.nbDaysByFonctionnaire / 12
        const nbHoursPerDay = this.categorySelected === MAGISTRATS ? this.nbHoursPerDayAndMagistrat : this.nbHoursPerDayAndFonctionnaire
        const valETPT = this.categorySelected === MAGISTRATS ? [...value1ETPTSiege] : [...value1ETPTGreffe]
        const value2Sorties = [
          ...value1Sorties.map((v1, index) => {
            if (value2TempsMoyen[index] !== null && valETPT[index] !== null) {
              // nouvelle sorties = etpt * nb dossier
              // nb dossier = (nb hours * nb days) / temps moyen

              return Math.floor(((valETPT[index] || 0) * nbHoursPerDay * nbDayByMonth) / (value2TempsMoyen[index] || 0))
            }

            return null
          }),
        ]

        list.push({
          title: 'Temps moyen',
          dataType: 'temps-moyen',
          type: 'verticals-lines',
          description: 'de la période<br/>v/s<br/>temps moyen de référence',
          lineMax: Math.max(...value1TempsMoyen.map((m) => m || 0), ...value2TempsMoyen.map((m) => m || 0)) * 1.1,
          values: value1TempsMoyen.map((v, index) => [value2TempsMoyen[index] || 0, v || 0]),
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

              return fixDecimal((value1Stock[index] || 0) / (value2Sorties[index] || 0), 10)
            }

            return null
          }),
        ]
        const variationsDTES = getVariations(value2DTES, value1DTES)
        list.push({
          title: 'DTES',
          dataType: 'dtes',
          type: 'verticals-lines',
          description: 'de la période<br/>v/s<br/>DTES possible<br/><br/>(calculé sur les 12 mois précédents)',
          lineMax: Math.max(...value1DTES.map((m) => m || 0), ...value2DTES.map((m) => m || 0)) * 1.1,
          values: value1DTES.map((v, index) => [value2DTES[index] || 0, v || 0]),
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
            if (value2Sorties[index] !== null && value1Entrees[index] !== null) {
              // Taux de couverture = sorties / entrees

              return fixDecimal((value2Sorties[index] || 0) / (value1Entrees[index] || 0), 10)
            }

            return null
          }),
        ]

        console.log('fx', value2TauxCouverture, value1TauxCouverture)
        const variationsCouverture = getVariations(value2TauxCouverture, value1TauxCouverture, false)
        list.push({
          title: 'Taux de couverture',
          dataType: 'taux-couverture',
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
              values: value2TauxCouverture.map((t) => (t === null ? 'N/R' : Math.floor(t * 100) + ' %')),
            },
            {
              label: actualRangeString,
              values: value1TauxCouverture.map((t) => (t === null ? 'N/R' : Math.floor(t * 100) + ' %')),
            },
          ],
        })
        const variationsSorties = getVariations(value2Sorties, value1Sorties)
        list.push({
          title: 'Sorties',
          dataType: 'sorties',
          type: 'verticals-lines',
          description: 'de la période<br/>v/s<br/>sorties mensuelles possibles',
          lineMax: Math.max(...value1Sorties.map((m) => m || 0), ...value2Sorties.map((m) => m || 0)) * 1.1,
          values: value1Sorties.map((v, index) => [value2Sorties[index] || 0, v || 0]),
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
      this.documentation.path = this.docLinks[2]
    }
    this.appService.notification('Les données du cockpit ont été mises à jour !')
  }

  getHours(value: number) {
    return Math.floor(value)
  }

  getMinutes(value: number) {
    //return (Math.floor((value - Math.floor(value)) * 60) + '').padStart(2, '0');
    let h = Math.floor(value)
    return (Math.round((value - h) * 60) + '').padStart(2, '0')
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
    if (this.categorySelected === 'magistrats') this.filteredBackups = this.backups.filter((r) => r.type === 'SIEGE')
    else this.filteredBackups = this.backups.filter((r) => r.type === 'GREFFE')
  }

  /**
   * Drop down deselection
   */
  unselectTemplate() {
    this.showPicker = false
    this.compareTemplates = null
    if ([0, 1].includes(this.tabSelected)) {
      this.documentation.path = this.docLinks[this.tabSelected]
    }
    this.referentiels = this.referentiels.map((x) => {
      x.selected = false
      return x
    })
  }

  /**
   * Envoie d'une log lors de l'ouverture de la vue graphique
   */
  logChartView() {
    this.kpiService.register(CALCULATOR_OPEN_CHARTS_VIEW, '')
  }

  /**
   * Obtenir la liste des referentiels filtrés
   */
  get filteredReferentiels() {
    return this._filteredReferentiels
  }

  filterReferentiels(referentiels: any[]) {
    let refsList = referentiels.reduce((previous, current) => {
      if (current.datas && current.datas && current.datas.referentielId) {
        const bup = this.backups.find((b) => b.id === current.datas.referentielId)
        if (bup && bup.type) {
          if (this.categorySelected === this.MAGISTRATS && bup.type !== 'SIEGE') {
            return previous
          } else if (this.categorySelected === this.FONCTIONNAIRES && bup.type !== 'GREFFE') {
            return previous
          }
        }
      }

      previous.push(current)
      return previous
    }, [])

    const start = month(this.calculatorService.dateStart.getValue(), -12)
    const stop = month(this.calculatorService.dateStop.getValue(), -12)
    const newLabel = `${this.getRealValue(start)} - ${this.getRealValue(stop)}`
    if (!refsList.find((r: any) => r.label === newLabel)) {
      refsList.splice(0, 0, {
        label: newLabel,
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

  /**
   * Mets à jour la liste des référentiels filtrés
   */
  updateFilteredReferentiels() {
    this._filteredReferentiels = this.filterReferentiels(this.referentiels)
  }

  saveCurrentAvgTime() {
    let datas: any[] = [...this.datas]

    datas = datas.filter((x) => x.magRealTimePerCase !== null)

    let list = new Array()

    this.createSaveReferentiel = true

    datas.map((y) => {
      list.push({
        averageProcessingTime: this.categorySelected === 'magistrats' ? y.magRealTimePerCase : y.fonRealTimePerCase,
        contentieux: { id: y.contentieux.id, label: y.contentieux.label },
      })
      y.childrens.map((z: any) => {
        list.push({
          averageProcessingTime: this.categorySelected === 'magistrats' ? z.magRealTimePerCase : z.fonRealTimePerCase,
          contentieux: { id: z.contentieux.id, label: z.contentieux.label },
        })
      })
    })

    this.contentieuxOptionsService.contentieuxOptions.next(list)
    this.contentieuxOptionsService.onSaveDatas(false, this.categorySelected === MAGISTRATS ? 'SIEGE' : 'GREFFE', this.defaultRefName, 'Enregistré')

    this.promptRef = false
  }

  /**
   * Popup de sauvegarde, action à effectuer
   */
  actionPopupFollow(event: any) {
    if (event.id === 'cancel') {
      this.promptRef = false
    }
    if (event.id === 'save') {
      this.saveCurrentAvgTime()
      this.displayRouterRef = true
    }
  }

  /**
   * Popup de sauvegarde, action à effectuer
   */
  actionPopupEnd(event: any) {
    if (event.id === 'cancel') {
      this.displayRouterRef = false
    }
    if (event.id === 'location') {
      this.router.navigate(['/temps-moyens'])
    }
  }

  setDefaultRefName() {
    let dates = `${this.getRealValue(this.dateStart)} à ${this.getRealValue(this.dateStop)}`
    this.defaultRefName = 'Mes TMD ' + (this.categorySelected === MAGISTRATS ? 'SIEGE' : 'GREFFE') + ' de ' + dates
  }

  /**
   * Ajout d'un nombre de mois à une date
   * @param date
   * @param months
   * @returns
   */
  override addMonthsToDate(date: Date | null, months: number): Date | null {
    return super.addMonthsToDate(date, months)
  }

  round2(num: number) {
    return Math.round(num * 100) / 100
  }
}
