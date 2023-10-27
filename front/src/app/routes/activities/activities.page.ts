import { Component, OnDestroy, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
import { DATA_GITBOOK } from 'src/app/constants/documentation'
import {
  ActivityInterface,
  NodeActivityUpdatedInterface,
} from 'src/app/interfaces/activity'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { DocumentationInterface } from 'src/app/interfaces/documentation'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { UserService } from 'src/app/services/user/user.service'
import { autoFocus } from 'src/app/utils/dom-js'

/**
 * Interface d'un référentiel spécifique à la page
 */
interface ContentieuReferentielActivitiesInterface
  extends ContentieuReferentielInterface {
  /**
   * Contentieux niveau 4
   */
  childrens?:
    | ContentieuReferentielActivitiesInterface[]
    | ContentieuReferentielInterface[]
  /**
   * Log de mise à jour de donnée d'activité
   */
  activityUpdated: NodeActivityUpdatedInterface | null
  /**
   * Auto focus value
   */
  autoFocusInput?: string
}

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
  }
  /**
   * Lien du guide de la donnée
   */
  gitBook = DATA_GITBOOK
  /**
   * Support GitBook
   */
  supportGitBook = `mailto:${this.environment.supportEmail}?subject=[RETOUR DATA] Données d'activité&body=J’ai des interrogations/réactions sur les données d’activité de ma juridiction et n’ai pas trouvé de réponse dans le data-book.%0D %0D Ma question/réaction porte sur :%0D %0D %0D %0D %0D Je souhaite être recontacté : par téléphone/par mail %0D %0D Voici mes coordonnées :`

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
    private userService: UserService,
    private route: ActivatedRoute
  ) {
    super()

    this.watch(
      this.humanResourceService.backupId.subscribe((backupId) => {
        if (backupId) {
          this.activitiesService.getLastMonthActivities().then((lastMonth) => {
            lastMonth = new Date(lastMonth)

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
        .then(() => this.onLoadMonthActivities())
    }, 750)
  }

  /**
   * Changement de la date via le selecteur
   * @param date
   */
  changeMonth(date: Date) {
    this.activitiesService.activityMonth.next(date)
  }

  /**
   * Chargement de la liste des activités d'un mois sélectionné
   */
  onLoadMonthActivities() {
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
        console.log(monthValues.list)

        const referentiels = [
          ...this.humanResourceService.contentieuxReferentiel.getValue(),
        ]

        const oldReferentielSetted = [...this.referentiel]
        let autoFocusId = null
        // todo set in, out, stock for each
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
              const getChildrenActivity = activities.find(
                (a) => a.contentieux.id === c.id
              )
              c.in = getChildrenActivity ? getChildrenActivity.entrees : null
              c.originalIn = getChildrenActivity
                ? getChildrenActivity.originalEntrees
                : null
              c.out = getChildrenActivity ? getChildrenActivity.sorties : null
              c.originalOut = getChildrenActivity
                ? getChildrenActivity.originalSorties
                : null
              c.stock = getChildrenActivity ? getChildrenActivity.stock : null
              c.originalStock = getChildrenActivity
                ? getChildrenActivity.originalStock
                : null

              return {
                ...c,
                activityUpdated:
                  (getChildrenActivity && getChildrenActivity.updatedBy) ||
                  null,
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
              activityUpdated: (getActivity && getActivity.updatedBy) || null,
              showActivityGroup,
            }
          })

        if (autoFocusId) {
          autoFocus(`#${autoFocusId}`)
        }
      })
  }

  /**
   * Retour des titres des infos bulles
   * @param type
   * @param contentieux
   * @param value
   * @returns
   */
  getTooltipTitle(
    type: 'entrees' | 'sorties' | 'stock',
    contentieux: ContentieuReferentielActivitiesInterface,
    value: number | null
  ) {
    const activityUpdated = contentieux.activityUpdated
    const modifyBy =
      activityUpdated && activityUpdated[type] ? activityUpdated[type] : null
    let string = `<div class="flex-center"><i class="margin-right-8 color-white ${
      value !== null
        ? modifyBy
          ? 'ri-lightbulb-flash-fill'
          : 'ri-lightbulb-flash-line'
        : ''
    }"></i><p class="color-white">`

    switch (type) {
      case 'entrees':
        string += 'Entrées A-JUSTées'
        break
      case 'sorties':
        string += 'Sorties A-JUSTées'
        break
      case 'stock':
        string += 'Stock A-JUSTé'

        if (value !== null) {
          const isMainActivity =
            this.referentielService.mainActivitiesId.indexOf(contentieux.id) !==
            -1
          const activityUpdated = contentieux.activityUpdated
          const modifyBy =
            activityUpdated && activityUpdated[type]
              ? activityUpdated[type]
              : null
          if (isMainActivity || !modifyBy) {
            string += ' - Calculé'
          }
        }
        break
    }
    string += '</p></div>'

    if (value !== null && modifyBy) {
      const date = new Date(modifyBy.date)
      string += `<p class="color-white font-size-12">Modifié par <b>${
        modifyBy.user?.firstName
      } ${
        modifyBy.user?.lastName
      }</b> le ${date.getDate()} ${this.getShortMonthString(
        date
      )} ${date.getFullYear()}</p>`
    }

    return string
  }

  /**
   * Retour du contenu des tooltips
   * @param type
   * @param contentieux
   * @param value
   * @param level
   * @returns
   */
  getTooltipBody(
    type: 'entrees' | 'sorties' | 'stock',
    contentieux: ContentieuReferentielActivitiesInterface,
    value: number | null,
    level: number
  ) {
    const activityUpdated = contentieux.activityUpdated
    const modifyBy =
      value !== null && activityUpdated && activityUpdated[type]
        ? activityUpdated[type]
        : null

    switch (type) {
      case 'entrees':
      case 'sorties':
        if (level === 3) {
          if (value !== null) {
            return `Dès lors que des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } sont saisies dans l'un des sous-contentieux de cette colonne, le total des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } de ce contentieux s'A-JUSTe automatiquement en additionnant les données A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres.`
          } else {
            return `Dès lors que des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } seront saisies dans l'un des sous-contentieux de cette colonne, le total des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } de ce contentieux s'A-JUSTera automatiquement en additionnant les données A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres.`
          }
        } else {
          if (modifyBy) {
            return `Dès lors que cette donnée ${
              type === 'entrees' ? "d'entrées" : 'de sorties'
            } mensuelles est modifié manuellement, votre stock est recalculé en prenant en compte cette valeur dans "Stock A-JUSTé".`
          } else {
            return `Dès lors que cette donnée ${
              type === 'entrees' ? "d'entrées" : 'de sorties'
            } mensuelles sera modifiée manuellement, votre stock sera recalculé en prenant en compte cette valeur dans "Stock A-JUSTé"`
          }
        }
      case 'stock': {
        if (level === 3) {
          if (value !== null) {
            return "Dès lors que des données de stock ont été saisies manuellement ou calculées dans l'un des sous-contentieux de cette colonne, le total du stock de ce contentieux s'A-JUSTe automatiquement en additionnant les données de stock A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres."
          } else {
            return "Dès lors que des données de stock seront saisies manuellement ou calculées dans l'un des sous-contentieux de cette colonne, le total du stock de ce contentieux s'A-JUSTera automatiquement en additionnant les données de stock A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres."
          }
        } else {
          if (modifyBy) {
            return `Cette donnée a été saisie manuellement et sera prise en compte pour le calcul du stock des mois prochains.<br/>Si vous modifiez les entrées et/ou les sorties ou données de stock des mois antérieurs, cette valeur ne sera pas modifiée.`
          } else if (value !== null) {
            return `Cette valeur de stock a été recalculée automatiquement, car vous avez saisi des données d'entrées, sorties ou stock pour l'un des mois précédents, ou parce que vous avez A-JUSTé les entrées ou sorties du mois en cours. <br/>Les stocks des prochains mois seront également recalculés à partir de cette valeur.<br/>Vous pouvez modifier manuellement cette donnée. Le cas échéant, les stocks des prochains mois seront recalculés à partir de la valeur que vous aurez saisie.<br/>Dès lors que vous A-JUSTez manuellement un stock, il ne sera plus recalculé, même si vous modifiez les entrées ou sorties du mois en cours ou des mois antérieurs.`
          } else {
            return `Cette valeur de stock sera recalculée automatiquement, dès lors que vous aurez saisi des données d'entrées, sorties ou stock pour l'un des mois précédents, ou si vous avez A-JUSTé les entrées ou sorties du mois en cours. Si vous modifiez manuellement cette donnée, les stocks des prochains mois seront recalculés à partir de la valeur que vous aurez saisie.<br/>Dès lors que vous A-JUSTez manuellement un stock, il ne sera plus recalculé, même si vous modifiez les entrées ou sorties des mois antérieurs.`
          }
        }
      }
    }
  }

  /**
   * Retourne le pied des tooltips
   * @param type
   * @param contentieux
   * @param value
   * @param level
   * @returns
   */
  getTooltipFooter(
    type: string,
    contentieux: ContentieuReferentielActivitiesInterface,
    value: number | null,
    level: number
  ) {
    if (type === 'stock' && level === 4) {
      if (value !== null) {
        const activityUpdated = contentieux.activityUpdated
        const modifyBy =
          activityUpdated && activityUpdated[type]
            ? activityUpdated[type]
            : null

        if (modifyBy) {
          return ''
        }

        return `Calcul :<br/>Stock A-JUSTé M = stock* mois M-1 + entrées* mois M - sorties* mois M<br/>* le stock A-JUSTé se recalcule dès lors qu'au moins l'une de ces 3 valeurs a été A-JUSTée`
      }

      return 'Calcul :<br/>Stock mois M = Stock mois M-1 + Entrées mois M - Sorties mois M'
    }

    return ''
  }

  /**
   * Force l'ouverture du paneau d'aide
   * @param type
   */
  onShowPanel(type: string) {
    switch (type) {
      case 'logiciel':
        this.wrapper?.onForcePanelHelperToShow({
          title: "Données d'activité logiciel",
          path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/donnees-dactivite/donnees-dactivite-logiciel',
        })
        break
      case 'saisie':
        this.wrapper?.onForcePanelHelperToShow({
          title: "Données d'activité A-JUSTées",
          path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/donnees-dactivite/donnees-dactivite-a-justees',
        })
        break
    }
  }
}
