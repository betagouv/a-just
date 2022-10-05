import { Component, OnDestroy } from '@angular/core'
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

interface ContentieuReferentielActivitiesInterface
  extends ContentieuReferentielInterface {
  activityUpdated: NodeActivityUpdatedInterface | null
}

@Component({
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
})
export class ActivitiesPage extends MainClass implements OnDestroy {
  activities: ActivityInterface[] = []
  activityMonth: Date = new Date()
  referentiel: ContentieuReferentielActivitiesInterface[] = []
  updatedBy: {
    user: UserInterface | null
    date: Date
  } | null = null
  timeoutUpdateAcitity: any = {}
  canEditActivities: boolean = false
  isLoadedFirst: boolean = true
  documentation: DocumentationInterface = {
    title: "Données d'activité A-JUST :",
    path: 'https://a-just.gitbook.io/documentation-deploiement/donnees-dactivite/quest-ce-que-cest',
  }

  constructor(
    private activitiesService: ActivitiesService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private userService: UserService
  ) {
    super()

    this.watch(
      this.humanResourceService.backupId.subscribe((backupId) => {
        if (backupId) {
          this.activitiesService.getLastMonthActivities().then((lastMonth) => {
            lastMonth = new Date(lastMonth)
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

  ngOnDestroy() {
    this.watcherDestroy()
  }

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

      this.updatedBy = {
        date: new Date(),
        user: this.userService.user.getValue(),
      }
    }, 500)
  }

  changeMonth(date: Date) {
    this.activitiesService.activityMonth.next(date)
  }

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
        // todo set in, out, stock for each
        this.referentiel = referentiels
          .filter(
            (r) =>
              this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
              this.referentielService.idsSoutien.indexOf(r.id) === -1
          )
          .map((ref) => {
            const getActivity = activities.find(
              (a) => a.contentieux.id === ref.id
            )
            ref.in = getActivity ? getActivity.entrees : null
            ref.originalIn = getActivity ? getActivity.originalEntrees : null
            ref.out = getActivity ? getActivity.sorties : null
            ref.originalOut = getActivity ? getActivity.originalSorties : null
            ref.stock = getActivity ? getActivity.stock : null
            ref.originalStock = getActivity ? getActivity.originalStock : null

            ref.childrens = (ref.childrens || []).map((c) => {
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
              (i) => i.id === ref.id
            )
            return {
              ...ref,
              activityUpdated: (getActivity && getActivity.updatedBy) || null,
              showActivityGroup: oldReferentielFinded
                ? oldReferentielFinded.showActivityGroup
                : false,
            }
          })
      })
  }

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

    if (modifyBy) {
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

    if(type === 'entrees' && level === 3) {
      console.log({contentieux, type, value, modifyBy, level})
    }

    switch (type) {
      case 'entrees':
        case 'sorties':
        if (level === 3) {
          if(value !== null) {
            return `Dès lors que des ${type === 'entrees' ? 'entrées' : 'sorties'} sont saisies dans l'un des sous-contentieux de cette colonne, le total des ${type === 'entrees' ? 'entrées' : 'sorties'} de ce contentieux s'A-JUSTe automatiquement en additionnant les données A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres.`
          } else {
            return `Dès lors que des ${type === 'entrees' ? 'entrées' : 'sorties'} seront saisies dans l'un des sous-contentieux de cette colonne, le total des ${type === 'entrees' ? 'entrées' : 'sorties'} de ce contentieux s'A-JUSTera automatiquement en additionnant les données A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres.`
          }
        } else {
          if(modifyBy) {
            return `Dès lors que cette donnée ${type === 'entrees' ? 'd\'entrées' : 'de sorties'} mensuelles est modifié manuellement, votre stock est recalculé en prenant en compte cette valeur dans "Stock A-JUSTé".`
          } else {
            return `Dès lors que cette donnée ${type === 'entrees' ? 'd\'entrées' : 'de sorties'} mensuelles sera modifiée manuellement, votre stock sera recalculé en prenant en compte cette valeur dans "Stock A-JUSTé"`
          }
        }
      case 'stock': {
        if (level === 3) {
          if(value !== null) {
            return "Dès lors que des données de stock ont été saisies manuellement ou calculées dans l'un des sous-contentieux de cette colonne, le total du stock de ce contentieux s'A-JUSTe automatiquement en additionnant les données de stock A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres."
          } else {
            return "Dès lors que des données de stock seront saisies manuellement ou calculées dans l'un des sous-contentieux de cette colonne, le total du stock de ce contentieux s'A-JUSTera automatiquement en additionnant les données de stock A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres."
          }
        } else {
          return 'Dès lors que cette donnée d\'entrées/sorties mensuelles est modifié manuellement, votre stock est recalculé en prenant en compte cette valeur dans "Stock A-JUSTé".'
        }
      }
    }
  }

  getTooltipFooter(
    type: string,
    contentieux: ContentieuReferentielActivitiesInterface,
    value: number | null
  ) {
    if (type === 'stock') {
      if (value !== null) {
        const activityUpdated = contentieux.activityUpdated
        const modifyBy =
          activityUpdated && activityUpdated[type]
            ? activityUpdated[type]
            : null

        if (modifyBy) {
          return ''
        }

        return 'Calcul :<br/>Stock A-JUSTé M+1 = stock A-JUSTé mois M + entrées mois M+1 - sorties mois M+1'
      }

      return 'Calcul :<br/>Stock mois M = Stock mois M-1 + Entrées mois M - Sorties mois M'
    }

    return ''
  }
}
