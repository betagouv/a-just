import { Component, OnDestroy, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Subscription, from } from 'rxjs'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
import { DATA_GITBOOK } from 'src/app/constants/documentation'
import {
  ActivityInterface,
  NodeActivityUpdatedInterface,
} from 'src/app/interfaces/activity'
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
import { UserService } from 'src/app/services/user/user.service'
import { autoFocus } from 'src/app/utils/dom-js'
import { downloadFile } from 'src/app/utils/system'
import { activityPercentColor } from 'src/app/utils/activity'
//import { filterReferentiels } from 'src/app/utils/referentiel'

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

          console.log('REFERENTIEL:', this.referentiel)

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
  getTooltipTitle(
    contentieux: ContentieuReferentielActivitiesInterface,
  ) {
    /*switch (contentieux) {
    }*/

    return contentieux.label
  }

  /**
   * Retour du contenu des tooltips
   * @param contentieux
   * @returns
   */
  getTooltipBody(
    contentieux: ContentieuReferentielActivitiesInterface,
  ) {
    /*switch (contentieux) {
    }*/

    return 'Test'
  }

  /**
   * Retourne le pied des tooltips
   * @param contentieux
   * @returns
   */
  getTooltipFooter(
    contentieux: ContentieuReferentielActivitiesInterface,
  ) {
    return ''
  }

  /**
   * Force l'ouverture du paneau d'aide
   * @param type
   */
  onShowPanel({label, url} : {label: string, url: string}) {
    this.wrapper?.onForcePanelHelperToShow({
      title: label,
      path: url,
    })
  }

  /**
   * On close contentieux updated
   */
  onCloseEditedPopin(reload = false) {
    this.contentieuxToUpdate = null

    if(reload) {
      this.onLoadMonthActivities()
    }
  }


  downloadAsset(type: string, download = false) {
    let url = null

    if (type === 'nomenclature')
      url = this.nomenclature
    else if (type === 'dataBook')
      url = this.dataBook

    if (url) {
      if (download) {
        downloadFile(url)
      } else {
        window.open(url)
     }
    }
  }


  getAcivityPercentColor(value : number) {
    return activityPercentColor(value)
  }

  getCompletionStatus( item : ContentieuReferentielInterface ) {
    const quality = {in: item.valueQualityIn, out: item.valueQualityOut, stock: item.valueQualityStock}
   
    if (item){
      if (Object.values(quality).find(value => value === 'facultatif'))
        return 'Compléter'
      else if (Object.values(quality).find(value => value === 'to_complete'))
        return 'A compléter'
      else if (Object.values(quality).find(value => value === 'to_verify'))
        return 'A vérifier'
    }
    return 'A-JUSTer'
  }
}
