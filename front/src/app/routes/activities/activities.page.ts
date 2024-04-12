import { Component, OnDestroy, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
import { DATA_GITBOOK } from 'src/app/constants/documentation'
import { ActivityInterface } from 'src/app/interfaces/activity'
import {
  ContentieuReferentielActivitiesInterface,
  ContentieuReferentielInterface,
} from 'src/app/interfaces/contentieu-referentiel'
import { DateSelectorinterface } from 'src/app/interfaces/date'
import { DocumentationInterface } from 'src/app/interfaces/documentation'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { autoFocus } from 'src/app/utils/dom-js'
import { downloadFile } from 'src/app/utils/system'
import { activityPercentColor } from 'src/app/utils/activity'
import { IntroJSStep } from 'src/app/components/intro-js/intro-js.component'
import { sleep } from 'src/app/utils'

/**
 * Composant page activité
 */
@Component({
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
})
export class ActivitiesPage extends MainClass implements OnDestroy {
  /**
   * Dom du wrapper
   */
  @ViewChild('wrapper') wrapper: WrapperComponent | undefined
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
    path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/donnees-dactivite/quest-ce-que-cest',
    printSubTitle: true,
  }
  /**
   * Selection d'un mois de donnée à afficher
   */
  dateSelector: DateSelectorinterface = {
    title: 'Voir les données de',
    dateType: 'month',
    value: null,
  }
  /**
   * Lien du guide de la donnée
   */
  gitBook = DATA_GITBOOK
  /**
   * Lien vers la nomenclature a-just
   */
  nomenclature = '/assets/nomenclature-A-Just.html'
  /**
   * Lien vers le data book
   */
  dataBook = 'https://docs.a-just.beta.gouv.fr/le-data-book/'
  /**
   * Support GitBook
   */
  supportGitBook = `mailto:${this.environment.supportEmail}?subject=[RETOUR DATA] Données d'activité&body=J’ai des interrogations/réactions sur les données d’activité de ma juridiction et n’ai pas trouvé de réponse dans le data-book.%0D %0D Ma question/réaction porte sur :%0D %0D %0D %0D %0D Je souhaite être recontacté : par téléphone/par mail %0D %0D Voici mes coordonnées :`
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
   * Intro JS Steps
   */
  introSteps: IntroJSStep[] = [
    {
      target: '#wrapper-contener',
      title: "Qu'est-ce que c'est ?",
      intro:
        "Sur cet écran, retrouvez vos <b>données d'activité</b> : <b>entrées, sorties et stock</b> par contentieux et sous-contentieux. Ces données sont importées depuis vos logiciels métier chaque mois, et réactualisées automatiquement pour les mois précédents depuis 12 mois.",
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
      intro:
        'Désignent l’ensemble des nouveaux dossiers enregistrés dans le mois.',
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
      intro:
        'Vous indique le <b>pourcentage de données renseignées et/ou complétées</b> par contentieux.',
    },
    {
      target: '.content-list .item-grouped:first-child',
      title: 'Vérifier, compléter ou a-juster : que faire ?',
      intro:
        'Pour chaque sous-contentieux, vous pouvez :<ul><li><b>Vérifier</b> les données d\'activité « logiciel », extraites à la fin de chaque mois par A-JUST des logiciels métiers utilisés par la juridiction. Cette mention apparaît pour tous les sous-contentieux dont nous savons que nos remontées peuvent varier en comparaison avec vos données locales.</li><li><b>Compléter</b> manuellement si nécessaire les entrées, les sorties et/ou le stock pour augmenter le pourcentage de complétude des données du contentieux.</li><li><b>A-JUSTer</b> la donnée logiciel si elle ne vous semble pas correcte. Une fois sur la page de complétion, vous pourrez saisir une nouvelle donnée, choisir de "confirmer" la donnée existante si, au contraire, elle vous parait correcte. Vous pouvez également choisir de la laisser comme telle.</li>',
        beforeLoad: async (intro: any) => {
          const subTools = document.querySelector('.item-grouped .group')
          if(subTools && subTools.getBoundingClientRect().height === 0) {
            const itemToClick = document.querySelector('.item.selectable')
            if(itemToClick) {
              // @ts-ignore
              itemToClick.click()
              await sleep(200)
            }
          }
        }
    },
    {
      target: '.menu-item.tools',
      title: 'Les ressources (outils)',
      intro:
        "Pour vous aider, retrouver :<ul><li>le <b>data-book</b> regroupe toutes les réponses aux questions que vous vous posez sur les <b>données d'activité</b> ;</li><li>la <b>nomenclature</b> permet par les <b>codes NAC</b> de connaître la nature des affaires prises en compte dans un sous-contentieux civil : c'est la <b>colonne vertébrale d'A-JUST</b> !",
    },
    {
      target: '.menu-item.tools',
      //target: '.menu .sub-tools > p:nth-child(4n)',
      title: "L'extracteur de données d'activité",
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
  ]

  /**
   * Constructeur
   * @param activitiesService
   * @param humanResourceService
   * @param referentielService
   * @param userService
   */
  constructor(
    private activitiesService: ActivitiesService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private route: ActivatedRoute
  ) {
    super()

    this.watch(
      this.humanResourceService.backupId.subscribe((backupId) => {
        if (backupId) {
          this.activitiesService.getLastMonthActivities().then((lastMonth) => {
            lastMonth = new Date(lastMonth)
            this.dateSelector.value = lastMonth

            const { month } = this.route.snapshot.queryParams
            if (
              month &&
              this.getMonth(month).getTime() <
                this.getMonth(lastMonth).getTime()
            ) {
              lastMonth = this.getMonth(month)
            }

            this.activitiesService.activityMonth.next(lastMonth)
          })
        }
      })
    )

    this.watch(
      this.activitiesService.activityMonth.subscribe((a) => {
        if (a !== null) {
          this.activityMonth = a
          this.onLoadMonthActivities()
        }
      })
    )
  }

  /**
   * Destruction des observables lors de la suppression de la page
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Modificiation de la donnée d'entrée, sorties, stock d'un contentieux
   * @param referentiel
   * @param subRef
   * @param nodeUpdated
   */
  onUpdateActivity(
    referentiel: ContentieuReferentielInterface,
    subRef: ContentieuReferentielInterface,
    nodeUpdated: string
  ) {
    referentiel.childrens = (referentiel.childrens || []).map(
      (ref: ContentieuReferentielInterface) => {
        if (ref.id === subRef.id) {
          ref.in = subRef.in
          ref.out = subRef.out
          ref.stock = subRef.stock
        }

        return ref
      }
    )

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
    const outValue = preformatArray(referentiel.childrens, [
      'out',
      'originalOut',
    ])
    const stockValue = preformatArray(referentiel.childrens, [
      'stock',
      'originalStock',
    ])
    referentiel.in =
      inValue === referentiel.originalIn &&
      referentiel.childrens.every((c) => c.in === null)
        ? null
        : inValue
    referentiel.out =
      outValue === referentiel.originalOut &&
      referentiel.childrens.every((c) => c.out === null)
        ? null
        : outValue
    referentiel.stock =
      outValue === referentiel.originalStock &&
      referentiel.childrens.every((c) => c.stock === null)
        ? null
        : stockValue

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
          nodeUpdated
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
    if (
      this.humanResourceService.contentieuxReferentiel.getValue().length === 0
    ) {
      // wait datas
      setTimeout(() => {
        this.onLoadMonthActivities()
      }, 300)
      return
    }

    this.activitiesService
      .loadMonthActivities(this.activityMonth)
      .then((monthValues) => {
        this.isLoadedFirst = false
        this.updatedBy = monthValues.lastUpdate
        const activities: ActivityInterface[] = monthValues.list
        this.activities = activities

        if (monthValues.list.length === 0) {
          this.canEditActivities = false
        } else {
          this.canEditActivities = true
        }

        const referentiels = [
          ...this.humanResourceService.contentieuxReferentiel.getValue(),
        ]

        const oldReferentielSetted = [...this.referentiel]
        let autoFocusId = null
        // todo set in, out, stock for each

        /*const backupLabel = localStorage.getItem('backupLabel')
        backupLabel && filterReferentiels(referentiels, backupLabel)*/

        this.referentiel = referentiels
          .filter(
            (r) =>
              this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
              this.referentielService.idsSoutien.indexOf(r.id) === -1
          )
          .map((ref) => {
            const newRef: ContentieuReferentielActivitiesInterface = {
              ...ref,
              activityUpdated: null,
            }

            const getActivity = activities.find(
              (a) => a.contentieux.id === newRef.id
            )
            newRef.in = getActivity ? getActivity.entrees : null
            newRef.originalIn = getActivity ? getActivity.originalEntrees : null
            newRef.out = getActivity ? getActivity.sorties : null
            newRef.originalOut = getActivity
              ? getActivity.originalSorties
              : null
            newRef.stock = getActivity ? getActivity.stock : null
            newRef.originalStock = getActivity
              ? getActivity.originalStock
              : null

            newRef.childrens = (newRef.childrens || []).map((c) => {
              if (!c.activityUpdated) {
                c.activityUpdated = {
                  entrees: null,
                  sorties: null,
                  stock: null,
                }
              }

              const getChildrenActivity = activities.find(
                (a) => a.contentieux.id === c.id
              )

              c.in = getChildrenActivity ? getChildrenActivity.entrees : null
              c.originalIn = getChildrenActivity
                ? getChildrenActivity.originalEntrees
                : null
              //c.activityUpdated.entrees = (c.in !== null && getChildrenActivity && getChildrenActivity.updatedBy) ? getChildrenActivity.updatedBy.entrees : null

              c.out = getChildrenActivity ? getChildrenActivity.sorties : null
              c.originalOut = getChildrenActivity
                ? getChildrenActivity.originalSorties
                : null
              //c.activityUpdated.sorties = (c.out !== null && getChildrenActivity && getChildrenActivity.updatedBy) ? getChildrenActivity.updatedBy.sorties : null

              c.stock = getChildrenActivity ? getChildrenActivity.stock : null
              c.originalStock = getChildrenActivity
                ? getChildrenActivity.originalStock
                : null
              //c.activityUpdated.stock = (c.stock != null && getChildrenActivity && getChildrenActivity.updatedBy) ? getChildrenActivity.updatedBy.stock : null

              return {
                ...c,
                activityUpdated:
                  (getChildrenActivity && getChildrenActivity.updatedBy) ||
                  null,
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
                    newRef.activityUpdated.entrees =
                      this.compareDateActivityUpdated({
                        firstAct: newRef.activityUpdated.entrees,
                        secondAct: child.activityUpdated.entrees,
                      })
                  else
                    newRef.activityUpdated.entrees =
                      child.activityUpdated.entrees
                }
                if (child.activityUpdated.sorties) {
                  if (newRef.activityUpdated.sorties)
                    newRef.activityUpdated.sorties =
                      this.compareDateActivityUpdated({
                        firstAct: newRef.activityUpdated.sorties,
                        secondAct: child.activityUpdated.sorties,
                      })
                  else
                    newRef.activityUpdated.sorties =
                      child.activityUpdated.sorties
                }
                if (child.activityUpdated.stock) {
                  if (newRef.activityUpdated.stock)
                    newRef.activityUpdated.stock =
                      this.compareDateActivityUpdated({
                        firstAct: newRef.activityUpdated.stock,
                        secondAct: child.activityUpdated.stock,
                      })
                  else
                    newRef.activityUpdated.stock = child.activityUpdated.stock
                }
              }
            })

            const oldReferentielFinded = oldReferentielSetted.find(
              (i) => i.id === newRef.id
            )
            let showActivityGroup = oldReferentielFinded
              ? oldReferentielFinded.showActivityGroup
              : false

            const { cont, selectedEmptyValue } = this.route.snapshot.queryParams
            if (
              oldReferentielSetted.length === 0 &&
              cont &&
              (+cont === ref.id ||
                (newRef.childrens || []).find((c) => c.id === +cont))
            ) {
              showActivityGroup = true

              if (selectedEmptyValue === 'true') {
                const getFocusInput = (
                  r:
                    | ContentieuReferentielActivitiesInterface
                    | ContentieuReferentielInterface
                ) => {
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
              }
              childToCount += 3
              if (child.in !== null || child.originalIn !== null) {
                childNotEmpty += 1
                if (child.compter) totalNotEmpty += 1
              }
              if (child.out !== null || child.originalOut !== null) {
                childNotEmpty += 1
                if (child.compter) totalNotEmpty += 1
              }
              if (child.stock !== null || child.originalStock !== null) {
                childNotEmpty += 1
                if (child.compter) totalNotEmpty += 1
              }
            }
            elem.completion =
              Math.round((childNotEmpty * 100) / childToCount) || 0
            for (const child of elem.childrens) {
              let nbToComplete = 0
              if (
                child.valueQualityIn === 'to_complete' &&
                child.originalIn === null &&
                child.in === null
              )
                nbToComplete += 1
              if (
                child.valueQualityOut === 'to_complete' &&
                child.originalOut === null &&
                child.out === null
              )
                nbToComplete += 1
              if (
                child.valueQualityStock === 'to_complete' &&
                child.originalStock === null &&
                child.stock === null
              )
                nbToComplete += 1
              child.possibleGainCompletion =
                Math.round(
                  ((childNotEmpty + nbToComplete) * 100) / childToCount
                ) - elem.completion || 0
            }
          }
        }
        this.totalCompletion =
          parseFloat(
            ((totalNotEmpty * 100) / totalContentieuxLevelFour).toFixed(2)
          ) || 0
        if (autoFocusId) {
          autoFocus(`#${autoFocusId}`)
        }
      })
  }

  /**
   * Retour des titres des infos bulles
   * @param contentieux
   * @returns
   */
  getTooltipTitle({ user, date }: { user: UserInterface; date: Date }) {
    return `<i class="ri-lightbulb-flash-line"></i> A-JUSTé <br/> par ${
      user.firstName
    } ${user.lastName} le ${this.getDate(date) || 'dd'} ${this.getMonthString(
      date
    )} ${this.getFullYear(date) || 'YYYY'}`
  }

  /**
   * Retour du contenu des tooltips
   * @param contentieux
   * @returns
   */
  getTooltipBody(contentieux: ContentieuReferentielActivitiesInterface) {
    /*switch (contentieux) {
    }*/
    return ''
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
      bgColor: this.referentielMappingColorActivity(label),
    })
  }

  /**
   * On close contentieux updated
   */
  onCloseEditedPopin(reload = false) {
    this.contentieuxToUpdate = null

    if (reload) {
      this.onLoadMonthActivities()
    }
  }

  downloadAsset(type: string, download = false) {
    let url = null

    if (type === 'nomenclature') url = this.nomenclature
    else if (type === 'dataBook') url = this.dataBook

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
      if (
        Object.values(quality).some((value) => value.quality === 'facultatif')
      )
        return 'Compléter'
      else if (
        Object.values(quality).some((value) => value.quality === 'to_complete')
      ) {
        const obj: any = Object.values(quality).filter(
          (value) => value.quality === 'to_complete'
        )
        for (let elem of obj) {
          if (elem.value === null && elem.original === null)
            return 'A compléter'
        }
      } else if (
        Object.values(quality).some((value) => value.quality === 'to_verify')
      ) {
        const obj: any = Object.values(quality).filter(
          (value) => value.quality === 'to_verify'
        )
        for (let elem of obj) {
          if (elem.value === null) return 'A vérifier'
        }
      }
    }
    return 'A-JUSTer'
  }

  setItemBgColor(label: string, elementId: number, remove: boolean = false) {
    const element = document.querySelector(`#item-${elementId}`) as HTMLElement
    const tmpColor = this.referentielMappingColorActivity(label)
      .replace(/[^\d,]/g, '')
      .split(',')
    tmpColor.pop()
    tmpColor.push('0.4')
    const bgColor = `rgba(${tmpColor.join(',')})`

    if (element) {
      if (remove) element.style.backgroundColor = 'transparent'
      else element.style.backgroundColor = bgColor
    }
  }

  checkIfBlueBottom(item: ContentieuReferentielInterface, node: string) {
    switch (node) {
      case 'entrees':
        if (item.valueQualityIn === 'to_verify') {
          if (
            item.in !== null &&
            item.activityUpdated &&
            item.activityUpdated.entrees &&
            item.in !== item.originalIn
          )
            return true
          else if (item.in === item.originalIn) return false
        } else {
          if (item.in !== null && item.in !== item.originalIn) return true
        }
        break
      case 'sorties':
        if (item.valueQualityOut === 'to_verify') {
          if (
            item.out !== null &&
            item.activityUpdated &&
            item.activityUpdated.sorties &&
            item.out !== item.originalOut
          )
            return true
          else if (item.out === item.originalOut) return false
        } else {
          if (item.out !== null && item.out !== item.originalOut) return true
        }
        break
      case 'stock':
        if (item.valueQualityStock === 'to_verify') {
          if (
            item.stock !== null &&
            item.activityUpdated &&
            item.activityUpdated.stock &&
            item.stock !== item.originalStock
          )
            return true
          else if (item.stock === item.originalStock) return false
        } else {
          if (item.stock !== null && item.stock !== item.originalStock)
            return true
        }
        break
    }
    return false
  }
}
