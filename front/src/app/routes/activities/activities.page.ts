import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { PopinEditActivitiesComponent } from './popin-edit-activities/popin-edit-activities.component'
import { MainClass } from '../../libs/main-class'
import { WrapperComponent } from '../../components/wrapper/wrapper.component'
import { ActivityInterface } from '../../interfaces/activity'
import { ContentieuReferentielActivitiesInterface, ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel'
import { UserInterface } from '../../interfaces/user-interface'
import { DateSelectorinterface } from '../../interfaces/date'
import { MIN_DATE_SELECT_TJ, MIN_DATE_SELECT_CA } from '../../constants/activities'
import {
  DATA_GITBOOK,
  DATA_GITBOOK_CA,
  NOMENCLATURE_DOWNLOAD_URL,
  NOMENCLATURE_DOWNLOAD_URL_CA,
  NOMENCLATURE_DROIT_LOCAL_DOWNLOAD_URL,
} from '../../constants/documentation'
import { DocumentationInterface } from '../../interfaces/documentation'
import { OPACITY_20 } from '../../constants/colors'
import { sleep } from '../../utils'
import { ActivitiesService } from '../../services/activities/activities.service'
import { HumanResourceService } from '../../services/human-resource/human-resource.service'
import { ReferentielService } from '../../services/referentiel/referentiel.service'
import { UserService } from '../../services/user/user.service'
import { KPIService } from '../../services/kpi/kpi.service'
import { referentielMappingName } from '../../utils/referentiel'
import { autoFocus } from '../../utils/dom-js'
import { downloadFile } from '../../utils/system'
import { activityPercentColor } from '../../utils/activity'
import { VALUE_QUALITY_TO_VERIFY } from '../../constants/referentiel'
import { ACTIVITIES_SHOW_LEVEL_4 } from '../../constants/log-codes'
import { MatIconModule } from '@angular/material/icon'
import { CommonModule } from '@angular/common'
import { TooltipsComponent } from '../../components/tooltips/tooltips.component'
import { CompletionBarComponent } from '../../components/completion-bar/completion-bar.component'
import { AppService } from '../../services/app/app.service'
import { IntroJSStep } from '../../services/tour/tour.service'

/**
 * Composant page activité
 */
@Component({
  standalone: true,
  imports: [PopinEditActivitiesComponent, MatIconModule, CommonModule, WrapperComponent, TooltipsComponent, CompletionBarComponent],
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
})
export class ActivitiesPage extends MainClass implements OnInit, OnDestroy {
  activitiesService = inject(ActivitiesService)
  humanResourceService = inject(HumanResourceService)
  referentielService = inject(ReferentielService)
  route = inject(ActivatedRoute)
  userService = inject(UserService)
  kpiService = inject(KPIService)
  appService = inject(AppService)
  /**
   * Dom du wrapper
   */
  @ViewChild('wrapper') wrapper: WrapperComponent | undefined
  /**
   * Popin to edit contentieux
   */
  @ViewChild('editActivites') editActivites: PopinEditActivitiesComponent | undefined
  /**
   * Liste des activités
   */
  activities: ActivityInterface[] = []
  /**
   * Date du mois sélectionné
   */
  activityMonth: Date = new Date()
  /**
   * Référentiel
   */
  referentiel: ContentieuReferentielActivitiesInterface[] = []
  /**
   * Node qui sauvegarde qui à modifié en dernier
   */
  updatedBy: {
    user: UserInterface | null
    date: Date
  } | null = null
  /**
   * Instance de l'auto mise à jours des activités
   */
  timeoutUpdateAcitity: any = {}
  /**
   * Affiche ou non un panel si les données existes
   */
  canEditActivities: boolean = false
  /**
   * Control si c'est le premier
   */
  isLoadedFirst: boolean = true
  /**
   * Lien de la doc
   */
  documentation: DocumentationInterface = {
    title: "Données d'activité A-JUST :",
    path: this.userService.isCa()
      ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/quest-ce-que-cest'
      : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/donnees-dactivite/quest-ce-que-cest',
    printSubTitle: true,
  }
  /**
   * Selection d'un mois de donnée à afficher
   */
  dateSelector: DateSelectorinterface = {
    title: 'Voir les données de',
    dateType: 'month',
    value: null,
    minDate: new Date(),
    showArrow: true,
  }
  /**
   * Lien du guide de la donnée
   */
  gitBook = DATA_GITBOOK
  /**
   * Lien vers le data book
   */
  dataBook = this.userService.isCa() ? 'https://docs.a-just.beta.gouv.fr/le-data-book-des-ca' : 'https://docs.a-just.beta.gouv.fr/le-data-book/'
  /**
   * Support GitBook
   */
  supportGitBook = `mailto:${
    import.meta.env.NG_APP_SUPPORT_EMAIL
  }?subject=[RETOUR DATA] Données d'activité&body=J’ai des interrogations/réactions sur les données d’activité de ma juridiction et n’ai pas trouvé de réponse dans le data-book.%0D %0D Ma question/réaction porte sur :%0D %0D %0D %0D %0D Je souhaite être recontacté : par téléphone/par mail %0D %0D Voici mes coordonnées :`
  /**
   * Boolean to need update
   */
  needUpdate: boolean = false
  /**
   * On focus
   */
  isOnFocus = false
  /**
   * timeoutOnFocus
   */
  timeoutOnFocus: any = {}
  /**
   * Contentieux to update
   */
  contentieuxToUpdate: ContentieuReferentielActivitiesInterface | null = null
  /**
   * Taux de completion total des données
   */
  totalCompletion: number = 0
  /**
   * Id du sous-contentieux selectionné
   */
  selectedReferentielId: number = 0
  /**
   * Opacité background des contentieux
   */
  OPACITY = OPACITY_20

  /**
   * Intro JS Steps
   */

  introSteps: IntroJSStep[] = this.userService.isTJ()
    ? [
        {
          target: '#wrapper-contener',
          title: "Qu'est-ce que c'est ?",
          intro:
            "Sur cet écran, retrouvez vos <b>données d'activité</b> : <b>entrées, sorties et stock</b> par contentieux et sous-contentieux. Ces données sont importées depuis vos logiciels métier chaque mois, et réactualisées automatiquement pour les mois précédents de l’année en cours et de l’année précédente.",
        },
        {
          target: '.date-selector',
          title: 'Le calendrier',
          intro:
            "Vous permet de visualiser les <b>données d'activité par mois</b> depuis 2021.<br/><b>Le taux de complétude global</b> vous indique <b>le pourcentage de données d'activité disponibles</b> sur l'ensemble des contentieux du mois sélectionné.",
        },
        {
          target: '.content-list .item-grouped:first-child .column-item:nth-child(3n)',
          title: 'Les entrées',
          intro: 'Désignent l’ensemble des nouveaux dossiers enregistrés dans le mois.',
        },
        {
          target: '.content-list .item-grouped:first-child .column-item:nth-child(4n)',
          title: 'Les sorties',
          intro:
            'Comptabilisent les dossiers qui ont été <b>enregistrés comme clôturés</b> dans les outils métiers durant le mois (ceux pour lesquels une <b>décision dessaisissante</b> a été rendue).',
        },
        {
          target: '.content-list .item-grouped:first-child .column-item:nth-child(5n)',
          title: 'Les stocks',
          intro:
            'Constituent <b>l’ensemble des dossiers en cours</b> (enregistrés comme des entrées mais pas encore enregistrés comme des sorties) à la fin du mois considéré.',
        },
        {
          target: '.content-list .item-grouped:first-child .completion',
          title: 'Le taux de complétude par contentieux',
          intro: 'Vous indique le <b>pourcentage de données renseignées et/ou complétées</b> par contentieux.',
        },
        {
          target: '.content-list .item-grouped:first-child',
          title: 'Vérifier, compléter ou A-JUSTer : que faire ?',
          intro:
            "Pour chaque sous-contentieux, vous pouvez :<ul><li><b>Vérifier</b> les données d'activité « logiciel », extraites à la fin de chaque mois par A-JUST des logiciels métiers utilisés par la " +
            (this.isTJ() ? 'juridiction' : "cour d'appel") +
            '. Cette mention apparaît pour tous les sous-contentieux dont nous savons que nos remontées peuvent varier en comparaison avec vos données locales.</li><li><b>Compléter</b> manuellement si nécessaire les entrées, sorties et/ou stocks qui ne sont pas pré-alimentés pour disposer de données exhaustives.</li><li><b>A-JUSTer</b> la donnée logiciel si elle ne vous semble pas correcte. Une fois sur la page de complétion, vous pourrez saisir une nouvelle donnée, choisir de "confirmer" la donnée existante si elle vous paraît correcte ou la laisser comme telle par défaut.</li>',
          beforeLoad: async (intro: any) => {
            const subTools = document.querySelector('.item-grouped .group')
            if (subTools && subTools.getBoundingClientRect().height === 0) {
              const itemToClick = document.querySelector('.item.selectable')
              if (itemToClick) {
                // @ts-ignore
                itemToClick.click()
                await sleep(200)
              }
            }
          },
        },
        {
          target: '.actions .right-panel',
          title: 'Les ressources (outils)',
          intro:
            "Pour vous aider, retrouvez :<ul><li>le <b>data-book</b> : regroupe toutes les réponses aux questions que vous vous posez sur les <b>données d'activité</b> ;</li><li>la <b>nomenclature</b> : permet par les <b>codes NAC</b> de connaître la nature des affaires prises en compte dans un sous-contentieux civil : c'est la <b>colonne vertébrale d'A-JUST</b> !",
        },
        {
          target: '.menu-item.tools',
          //target: '.menu .sub-tools > p:nth-child(4n)',
          title: "L'extracteur de données d'activité",
          intro: "Afin de conserver et réutiliser en dehors de l'outil vos données d'activité, vous pouvez les télécharger dans un fichier Excel.",
          /*intro:
        "Choisissez la <b>période</b> et obtenez toutes les données d'activité dans un <b>fichier Excel</b>.",
        beforeLoad: async (intro: any) => {
          const subTools = document.querySelector('.menu .sub-tools')
          if(!subTools) {
            const itemToClick = document.querySelector('.menu-item.tools')
            if(itemToClick) {
              // @ts-ignore
              itemToClick.click()
              await sleep(200)
            }
          }
        }*/
        },
        {
          target: '#wrapper-contener',
          title: 'Découvrir la fonctionnalité',
          intro:
            '<p>Consultez la vidéo ci-dessous pour plus de détails sur le fonctionnement de l\'écran des données d’activité.</p><video controls class="intro-js-video"><source src="/assets/videos/video-activites.mp4" type="video/mp4" /></video>',
        },
      ]
    : [
        {
          target: '#wrapper-contener',
          title: "Qu'est-ce que c'est ?",
          intro:
            "Sur cet écran, retrouvez vos <b>données d'activité</b> : <b>entrées, sorties et stock</b> par contentieux et sous-contentieux. Ces données sont importées depuis vos logiciels métier chaque mois, et réactualisées automatiquement pour les mois précédents de l’année en cours et de l’année précédente.",
        },
        {
          target: '.date-selector',
          title: 'Le calendrier',
          intro:
            "Vous permet de visualiser les <b>données d'activité par mois</b> depuis 2021.<br/><b>Le taux de complétude global</b> vous indique <b>le pourcentage de données d'activité disponibles</b> sur l'ensemble des contentieux du mois sélectionné.",
        },
        {
          target: '.content-list .item-grouped:first-child .column-item:nth-child(3n)',
          title: 'Les entrées',
          intro: 'Désignent l’ensemble des nouveaux dossiers enregistrés dans le mois.',
        },
        {
          target: '.content-list .item-grouped:first-child .column-item:nth-child(4n)',
          title: 'Les sorties',
          intro:
            'Comptabilisent les dossiers qui ont été <b>enregistrés comme clôturés</b> dans les outils métiers durant le mois (ceux pour lesquels une <b>décision dessaisissante</b> a été rendue).',
        },
        {
          target: '.content-list .item-grouped:first-child .column-item:nth-child(5n)',
          title: 'Les stocks',
          intro:
            'Constituent <b>l’ensemble des dossiers en cours</b> (enregistrés comme des entrées mais pas encore enregistrés comme des sorties) à la fin du mois considéré.',
        },
        {
          target: '.content-list .item-grouped:first-child .completion',
          title: 'Le taux de complétude par contentieux',
          intro: 'Vous indique le <b>pourcentage de données renseignées et/ou complétées</b> par contentieux.',
        },
        {
          target: '.content-list .item-grouped:first-child',
          title: 'Vérifier, compléter ou A-JUSTer : que faire ?',
          intro:
            "Pour chaque sous-contentieux, vous pouvez :<ul><li><b>Vérifier</b> les données d'activité « logiciel », extraites à la fin de chaque mois par A-JUST des logiciels métiers utilisés par la " +
            (this.isTJ() ? 'juridiction' : "cour d'appel") +
            '. Cette mention apparaît pour tous les sous-contentieux dont nous savons que nos remontées peuvent varier en comparaison avec vos données locales.</li><li><b>Compléter</b> manuellement si nécessaire les entrées, sorties et/ou stocks qui ne sont pas pré-alimentés pour disposer de données exhaustives.</li><li><b>A-JUSTer</b> la donnée logiciel si elle ne vous semble pas correcte. Une fois sur la page de complétion, vous pourrez saisir une nouvelle donnée, choisir de "confirmer" la donnée existante si elle vous paraît correcte ou la laisser comme telle par défaut.</li>',
          beforeLoad: async (intro: any) => {
            const subTools = document.querySelector('.item-grouped .group')
            if (subTools && subTools.getBoundingClientRect().height === 0) {
              const itemToClick = document.querySelector('.item.selectable')
              if (itemToClick) {
                // @ts-ignore
                itemToClick.click()
                await sleep(200)
              }
            }
          },
        },
        {
          target: '.actions .right-panel',
          title: 'Les ressources (outils)',
          intro:
            "Pour vous aider, retrouvez :<ul><li>le <b>data-book</b> : regroupe toutes les réponses aux questions que vous vous posez sur les <b>données d'activité</b> ;</li><li>la <b>nomenclature</b> : permet par les <b>codes NAC</b> de connaître la nature des affaires prises en compte dans un sous-contentieux civil : c'est la <b>colonne vertébrale d'A-JUST</b> !",
        },
        {
          target: '.menu-item.tools',
          //target: '.menu .sub-tools > p:nth-child(4n)',
          title: "L'extracteur de données d'activité",
          intro: "Afin de conserver et réutiliser en dehors de l'outil vos données d'activité, vous pouvez les télécharger dans un fichier Excel.",
          /*intro:
        "Choisissez la <b>période</b> et obtenez toutes les données d'activité dans un <b>fichier Excel</b>.",
        beforeLoad: async (intro: any) => {
          const subTools = document.querySelector('.menu .sub-tools')
          if(!subTools) {
            const itemToClick = document.querySelector('.menu-item.tools')
            if(itemToClick) {
              // @ts-ignore
              itemToClick.click()
              await sleep(200)
            }
          }
        }*/
        },
        {
          target: '#wrapper-contener',
          title: 'Découvrir la fonctionnalité',
          intro:
            '<p>Consultez la vidéo ci-dessous pour plus de détails sur le fonctionnement de l\'écran des données d’activité.</p><video controls class="intro-js-video small-video"><source src="/assets/videos/ca-activite.mp4" type="video/mp4" /></video>',
        },
      ]

  /**
   * Constructeur
   */
  constructor() {
    super()

    this.watch(
      this.humanResourceService.backupId.subscribe((backupId) => {
        if (backupId) {
          this.activitiesService.getLastMonthActivities().then((lastMonth) => {
            lastMonth = new Date(lastMonth)
            this.dateSelector.value = lastMonth

            const { month } = this.route.snapshot.queryParams
            if (month) {
              lastMonth = this.getMonth(month)
            }

            this.dateSelector.value = new Date(lastMonth)
            this.activitiesService.activityMonth.next(new Date(lastMonth))
          })
        }
      }),
    )

    this.watch(
      this.activitiesService.activityMonth.subscribe((a) => {
        if (a !== null) {
          this.appService.appLoading.next(true)
          this.activityMonth = a
          this.onLoadMonthActivities()
        }
      }),
    )

    this.userService.isCa() ? (this.dateSelector.minDate = MIN_DATE_SELECT_CA) : (this.dateSelector.minDate = MIN_DATE_SELECT_TJ)
  }

  ngOnInit() {
    if (!this.userService.canViewActivities()) {
      this.userService.redirectToHome()
    }

    this.onLoadMaxDate()
  }

  async onLoadMaxDate() {
    const resp = await this.activitiesService.getLastMonthActivities()
    if (resp) {
      const date = new Date(resp)
      this.dateSelector.maxDate = new Date(date.getFullYear(), 11, 31)
    }
  }

  /**
   * Destruction des observables lors de la suppression de la page
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Detect is TJ
   * @returns
   */
  isTJ() {
    return this.userService.interfaceType !== 1
  }

  /**
   * Modificiation de la donnée d'entrée, sorties, stock d'un contentieux
   * @param referentiel
   * @param subRef
   * @param nodeUpdated
   */
  onUpdateActivity(referentiel: ContentieuReferentielInterface, subRef: ContentieuReferentielInterface, nodeUpdated: string) {
    referentiel.childrens = (referentiel.childrens || []).map((ref: ContentieuReferentielInterface) => {
      if (ref.id === subRef.id) {
        ref.in = subRef.in
        ref.out = subRef.out
        ref.stock = subRef.stock
      }

      return ref
    })

    const preformatArray = (list: any[], index: string[]) => {
      let total: number | null = null
      list.map((item) => {
        for (let i = 0; i < index.length; i++) {
          if (item[index[i]] !== null) {
            total = (total || 0) + item[index[i]]
            break
          }
        }
      })

      return total !== null && total < 0 ? 0 : total
    }
    const inValue = preformatArray(referentiel.childrens, ['in', 'originalIn'])
    const outValue = preformatArray(referentiel.childrens, ['out', 'originalOut'])
    const stockValue = preformatArray(referentiel.childrens, ['stock', 'originalStock'])
    referentiel.in = inValue === referentiel.originalIn && referentiel.childrens.every((c) => c.in === null) ? null : inValue
    referentiel.out = outValue === referentiel.originalOut && referentiel.childrens.every((c) => c.out === null) ? null : outValue
    referentiel.stock = outValue === referentiel.originalStock && referentiel.childrens.every((c) => c.stock === null) ? null : stockValue

    // save datas
    if (this.timeoutUpdateAcitity[subRef.id]) {
      clearTimeout(this.timeoutUpdateAcitity[subRef.id])
      this.timeoutUpdateAcitity[subRef.id] = null
    }

    this.timeoutUpdateAcitity[subRef.id] = setTimeout(() => {
      this.activitiesService
        .updateDatasAt(
          subRef.id,
          this.activityMonth,
          {
            entrees: subRef.in,
            sorties: subRef.out,
            stock: subRef.stock,
          },
          nodeUpdated,
        )
        .then(() => (this.needUpdate = true))
    }, 500)
  }

  onFocusInput(startTimeout = true) {
    // save datas
    if (this.timeoutOnFocus) {
      clearTimeout(this.timeoutOnFocus)
      this.timeoutOnFocus = null
    }

    if (startTimeout) {
      this.timeoutOnFocus = setTimeout(() => {
        if (this.needUpdate) {
          this.needUpdate = false
          this.onLoadMonthActivities()
        }
      }, 200)
    }
  }

  compareDateActivityUpdated({
    firstAct,
    secondAct,
  }: {
    firstAct: { user: UserInterface | null; date: Date }
    secondAct: { user: UserInterface | null; date: Date }
  }) {
    const firstDate = new Date(firstAct.date)
    const secondDate = new Date(secondAct.date)

    if (secondDate.getTime() > firstDate.getTime()) return secondAct
    return firstAct
  }

  /**
   * Chargement de la liste des activités d'un mois sélectionné
   */
  onLoadMonthActivities() {
    if (this.humanResourceService.contentieuxReferentielOnlyFiltered.getValue().length === 0) {
      // wait datas
      setTimeout(() => {
        this.onLoadMonthActivities()
      }, 300)
      return
    }

    this.activitiesService
      .loadMonthActivities(this.activityMonth)
      .then((monthValues) => {
        if (this.getMonth(monthValues.date).getTime() !== this.getMonth(this.activityMonth).getTime()) {
          // fix double loading with different delay to rendering
          return
        }

        this.isLoadedFirst = false
        this.updatedBy = monthValues.lastUpdate
        const activities: ActivityInterface[] = monthValues.list
        this.activities = activities

        if (monthValues.list.length === 0) {
          this.canEditActivities = false
        } else {
          this.canEditActivities = true
        }

        const referentiels = [...this.humanResourceService.contentieuxReferentielOnlyFiltered.getValue()]
        const oldReferentielSetted = [...this.referentiel]
        let autoFocusId = null
        // todo set in, out, stock for each

        /*const backupLabel = localStorage.getItem('backupLabel')
        backupLabel && filterReferentiels(referentiels, backupLabel)*/

        this.referentiel = referentiels
          .filter((r) => this.referentielService.idsIndispo.indexOf(r.id) === -1 && this.referentielService.idsSoutien.indexOf(r.id) === -1)
          .map((ref) => {
            const newRef: ContentieuReferentielActivitiesInterface = {
              ...ref,
              activityUpdated: null,
            }

            newRef.label = referentielMappingName(ref.label)

            const getActivity = activities.find((a) => a.contentieux.id === newRef.id)
            newRef.in = getActivity ? getActivity.entrees : null
            newRef.originalIn = getActivity ? getActivity.originalEntrees : null
            newRef.out = getActivity ? getActivity.sorties : null
            newRef.originalOut = getActivity ? getActivity.originalSorties : null
            newRef.stock = getActivity ? getActivity.stock : null
            newRef.originalStock = getActivity ? getActivity.originalStock : null
            newRef.nbComments = getActivity ? getActivity.nbComments : undefined

            newRef.childrens = (newRef.childrens || []).map((c) => {
              if (!c.activityUpdated) {
                c.activityUpdated = {
                  entrees: null,
                  sorties: null,
                  stock: null,
                }
              }

              const getChildrenActivity = activities.find((a) => a.contentieux.id === c.id)

              c.in = getChildrenActivity ? getChildrenActivity.entrees : null
              c.originalIn = getChildrenActivity ? getChildrenActivity.originalEntrees : null
              //c.activityUpdated.entrees = (c.in !== null && getChildrenActivity && getChildrenActivity.updatedBy) ? getChildrenActivity.updatedBy.entrees : null

              c.out = getChildrenActivity ? getChildrenActivity.sorties : null
              c.originalOut = getChildrenActivity ? getChildrenActivity.originalSorties : null
              //c.activityUpdated.sorties = (c.out !== null && getChildrenActivity && getChildrenActivity.updatedBy) ? getChildrenActivity.updatedBy.sorties : null

              c.stock = getChildrenActivity ? getChildrenActivity.stock : null
              c.originalStock = getChildrenActivity ? getChildrenActivity.originalStock : null
              //c.activityUpdated.stock = (c.stock != null && getChildrenActivity && getChildrenActivity.updatedBy) ? getChildrenActivity.updatedBy.stock : null

              return {
                ...c,
                activityUpdated: (getChildrenActivity && getChildrenActivity.updatedBy) || null,
              }
            })
            if (!newRef.activityUpdated) {
              newRef.activityUpdated = {
                entrees: null,
                sorties: null,
                stock: null,
              }
            }

            newRef.childrens.map((child) => {
              if (child.activityUpdated && newRef.activityUpdated) {
                if (child.activityUpdated.entrees) {
                  if (newRef.activityUpdated.entrees)
                    newRef.activityUpdated.entrees = this.compareDateActivityUpdated({
                      firstAct: newRef.activityUpdated.entrees,
                      secondAct: child.activityUpdated.entrees,
                    })
                  else newRef.activityUpdated.entrees = child.activityUpdated.entrees
                }
                if (child.activityUpdated.sorties) {
                  if (newRef.activityUpdated.sorties)
                    newRef.activityUpdated.sorties = this.compareDateActivityUpdated({
                      firstAct: newRef.activityUpdated.sorties,
                      secondAct: child.activityUpdated.sorties,
                    })
                  else newRef.activityUpdated.sorties = child.activityUpdated.sorties
                }
                if (child.activityUpdated.stock) {
                  if (newRef.activityUpdated.stock)
                    newRef.activityUpdated.stock = this.compareDateActivityUpdated({
                      firstAct: newRef.activityUpdated.stock,
                      secondAct: child.activityUpdated.stock,
                    })
                  else newRef.activityUpdated.stock = child.activityUpdated.stock
                }
              }
            })

            const oldReferentielFinded = oldReferentielSetted.find((i) => i.id === newRef.id)
            let showActivityGroup = oldReferentielFinded ? oldReferentielFinded.showActivityGroup : false

            const { cont, selectedEmptyValue } = this.route.snapshot.queryParams
            if (oldReferentielSetted.length === 0 && cont && (+cont === ref.id || (newRef.childrens || []).find((c) => c.id === +cont))) {
              showActivityGroup = true

              if (selectedEmptyValue === 'true') {
                const getFocusInput = (r: ContentieuReferentielActivitiesInterface | ContentieuReferentielInterface) => {
                  if (r.originalIn === null && r.in === null) {
                    return 'in'
                  } else if (r.originalOut === null && r.out === null) {
                    return 'out'
                  } else if (r.originalStock === null && r.stock === null) {
                    return 'stock'
                  }

                  return ''
                }

                if (+cont === ref.id) {
                  //newRef.autoFocusInput = getFocusInput(newRef)
                  autoFocusId = `m-${ref.id}-${getFocusInput(newRef)}`
                } else {
                  newRef.childrens = (newRef.childrens || []).map((c) => {
                    if (c.id === +cont) {
                      const focusInputValue = getFocusInput(c)
                      autoFocusId = `c-${c.id}-${focusInputValue}`
                      return { ...c, autoFocusInput: focusInputValue }
                    }

                    return c
                  })
                }
              }
            }
            return {
              ...newRef,
              //activityUpdated: (getActivity && getActivity.updatedBy) || null,
              showActivityGroup,
            }
          })

        // Calcul du taux de completion
        let totalNotEmpty = 0
        let totalContentieuxLevelFour = 0
        for (const elem of this.referentiel) {
          let childNotEmpty = 0
          let childToCount = 0

          if (elem.childrens) {
            for (const child of elem.childrens) {
              if (child.compter) {
                totalContentieuxLevelFour += 3
                childToCount += 3
                if (child.in !== null || child.originalIn !== null) {
                  totalNotEmpty += 1
                  childNotEmpty += 1
                }
                if (child.out !== null || child.originalOut !== null) {
                  totalNotEmpty += 1
                  childNotEmpty += 1
                }
                if (child.stock !== null || child.originalStock !== null) {
                  totalNotEmpty += 1
                  childNotEmpty += 1
                }
              }
            }
            elem.completion = Math.round((childNotEmpty * 100) / childToCount) || 0
            for (const child of elem.childrens) {
              let nbToComplete = 0
              if (child.valueQualityIn === 'to_complete' && child.originalIn === null && child.in === null) nbToComplete += 1
              if (child.valueQualityOut === 'to_complete' && child.originalOut === null && child.out === null) nbToComplete += 1
              if (child.valueQualityStock === 'to_complete' && child.originalStock === null && child.stock === null) nbToComplete += 1
              child.possibleGainCompletion = Math.round(((childNotEmpty + nbToComplete) * 100) / childToCount) - elem.completion || 0
            }
          }
        }
        this.totalCompletion = Math.round(parseFloat(((totalNotEmpty * 100) / totalContentieuxLevelFour).toFixed(2))) || 0
        if (autoFocusId) {
          autoFocus(`#${autoFocusId}`)
        }
      })
      .finally(() => {
        this.appService.appLoading.next(false)
      })
  }

  /**
   * Retour des titres des infos bulles
   * @param contentieux
   * @returns
   */
  getTooltipTitle({ user, date }: { user?: UserInterface; date?: Date } = {}) {
    if (user && date)
      return `<i class="ri-lightbulb-flash-line"></i> A-JUSTé <br/> par ${
        user.firstName
      } ${user.lastName} le ${this.getDate(date) || 'dd'} ${this.getMonthString(date)} ${this.getFullYear(date) || 'YYYY'}`
    else return `<i class="ri-lightbulb-flash-line"></i> Stock calculé `
  }

  /**
   * Retour du contenu des tooltips
   * @param contentieux
   * @returns
   */
  getTooltipBody() {
    return "Cette valeur de stock a été recalculée automatiquement, car vous avez saisi des données d'entrées, sorties ou stock pour l'un des mois précédents, ou parce que vous avez A-JUSTé les entrées ou sorties du mois en cours."
  }

  /**
   * Retourne le pied des tooltips
   * @param contentieux
   * @returns
   */
  getTooltipFooter(contentieux: ContentieuReferentielActivitiesInterface) {
    return ''
  }

  /**
   * Force l'ouverture du paneau d'aide
   * @param type
   */
  onShowPanel({ label, url }: { label: string; url: string }) {
    this.wrapper?.onForcePanelHelperToShow({
      title: '',
      path: url,
      subTitle: '',
      printSubTitle: false,
      bgColor: this.userService.referentielMappingColorActivityByInterface(label, OPACITY_20),
      closeColor: 'black',
    })
  }

  /**
   * On close contentieux updated
   */
  onCloseEditedPopin({ reload = false, month = null }: { reload: boolean; month?: Date | null }) {
    this.contentieuxToUpdate = null
    if (month) {
      this.activityMonth = new Date(month)
      this.dateSelector.value = new Date(month)
    }
    if (reload) {
      this.onLoadMonthActivities()
    }
  }

  downloadAsset(type: string, download = false) {
    let url = null

    if (type === 'nomenclature') {
      if (this.userService.isCa()) {
        url = NOMENCLATURE_DOWNLOAD_URL_CA
      } else {
        if (this.referentielService.isDroitLocal()) {
          url = NOMENCLATURE_DROIT_LOCAL_DOWNLOAD_URL
        } else {
          url = NOMENCLATURE_DOWNLOAD_URL
        }
      }
    } else if (type === 'dataBook') {
      if (this.userService.isCa()) {
        url = DATA_GITBOOK_CA
      } else {
        url = DATA_GITBOOK
      }
    }

    if (url) {
      if (download) {
        downloadFile(url)
      } else {
        window.open(url)
      }
    }
  }

  getAcivityPercentColor(value: number) {
    return activityPercentColor(value)
  }

  getCompletionStatus(item: ContentieuReferentielInterface) {
    const quality = {
      in: {
        quality: item.valueQualityIn,
        value: item.in,
        original: item.originalIn,
      },
      out: {
        quality: item.valueQualityOut,
        value: item.out,
        original: item.originalOut,
      },
      stock: {
        quality: item.valueQualityStock,
        value: item.stock,
        original: item.originalStock,
      },
    }

    if (item) {
      if (Object.values(quality).some((elem) => elem.quality === 'facultatif')) {
        return 'Compléter'
      } else if (Object.values(quality).some((elem) => elem.quality === 'to_complete' && elem.value === null && elem.original === null)) {
        const obj: any = Object.values(quality).filter((elem) => elem.quality === 'to_complete')
        for (let elem of obj) {
          if (elem.value === null && elem.original === null) return 'A compléter'
        }
      } else if (Object.values(quality).some((elem) => elem.quality === 'to_verify')) {
        const obj: any = Object.values(quality).filter((elem) => elem.quality === 'to_verify')
        for (let elem of obj) {
          if (elem.value === null) return 'A vérifier'
        }
      }
    }
    return 'A-JUSTer'
  }

  setItemBgColor(label: string, elementId: number, remove: boolean = false) {
    const element = document.querySelector(`#item-${elementId}`) as HTMLElement
    const tmpColor = this.userService
      .referentielMappingColorActivityByInterface(this.userService.referentielMappingNameByInterface(label))
      .replace(/[^\d,]/g, '')
      .split(',')
    tmpColor.pop()
    tmpColor.push('0.1')
    const bgColor = `rgba(${tmpColor.join(',')})`

    if (element) {
      if (remove) element.style.backgroundColor = 'transparent'
      else element.style.backgroundColor = bgColor
    }
  }

  checkIfBlue({ cont, node, isForBulbOrBottom }: { cont: ContentieuReferentielInterface; node: string; isForBulbOrBottom: boolean }) {
    switch (node) {
      case 'entrees':
        if (this.isValueUpdated({ cont, node })) return true
        break
      case 'sorties':
        if (this.isValueUpdated({ cont, node })) return true
        break
      case 'stock':
        if (this.isValueUpdated({ cont, node })) {
          if (isForBulbOrBottom && this.isStockCalculated(cont)) return false
          else if (cont.stock !== cont.originalStock) return true
          return true
        }
        break
    }
    return false
  }

  isValueUpdated({ cont, node }: { cont: ContentieuReferentielInterface; node: string }) {
    switch (node) {
      case 'entrees':
        /*if (this.isValueToVerifySetted({ value: cont.in ?? cont.in ?? null, contentieux: cont, node: node }))
          return false
        else */ if (cont.in !== null) return true
        break
      case 'sorties':
        /*if (this.isValueToVerifySetted({ value: cont.out ?? cont.out ?? null, contentieux: cont, node: node }))
          return false
        else */ if (cont.out !== null) return true
        break
      case 'stock':
        /*if (this.isValueToVerifySetted({ value: cont.stock ?? cont.stock ?? null, contentieux: cont, node: node }))
          return false
        else */ if (cont.stock !== null) return true
        break
    }
    return false
  }

  isValueToVerifySetted({ value, contentieux, node }: { value: number | null; contentieux: ContentieuReferentielInterface; node: string }) {
    if (value !== null) {
      switch (node) {
        case 'entrees':
          if (value === contentieux.originalIn && contentieux.valueQualityIn === VALUE_QUALITY_TO_VERIFY) return true
          break
        case 'sorties':
          if (value === contentieux.originalOut && contentieux.valueQualityOut === VALUE_QUALITY_TO_VERIFY) return true
          break
        case 'stock':
          if (value === contentieux.originalStock && contentieux.valueQualityStock === VALUE_QUALITY_TO_VERIFY) return true
          break
        default:
          return false
      }
    }
    return false
  }

  isStockCalculated(cont: ContentieuReferentielInterface) {
    if (
      (cont.stock !== null &&
        (!cont.activityUpdated ||
          (cont.activityUpdated && !cont.activityUpdated.stock) ||
          (cont.activityUpdated && cont.activityUpdated.stock && cont.activityUpdated.stock.value === null))) ||
      cont.stock === null
    ) {
      return true
    }
    return false
  }

  onShowLevel4(cont: ContentieuReferentielActivitiesInterface) {
    if (cont.showActivityGroup) {
      this.kpiService.register(ACTIVITIES_SHOW_LEVEL_4, cont.id + '')
    }
  }

  showContComment(cont: ContentieuReferentielActivitiesInterface) {
    this.contentieuxToUpdate = cont

    setTimeout(() => {
      if (this.editActivites) {
        this.editActivites.showComments = true
      }
    }, 500)
  }
}
