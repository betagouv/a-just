import { Component, OnDestroy } from '@angular/core'
import { ActivityInterface } from 'src/app/interfaces/activity'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { UserService } from 'src/app/services/user/user.service'
import { month } from 'src/app/utils/dates'

@Component({
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
})
export class ActivitiesPage extends MainClass implements OnDestroy {
  activities: ActivityInterface[] = []
  activityMonth: Date = new Date()
  referentiel: ContentieuReferentielInterface[] = []
  updatedBy: {
    user: UserInterface | null
    date: Date
  } | null = null
  timeoutUpdateAcitity: any = {}
  canEditActivities: boolean = false
  isLoadedFirst: boolean = false

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
            console.log(lastMonth)
            lastMonth = new Date(lastMonth)
            console.log(lastMonth)
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

      return total
    }
    referentiel.in = preformatArray(referentiel.childrens, ['in', 'originalIn'])
    referentiel.out = preformatArray(referentiel.childrens, [
      'out',
      'originalOut',
    ])
    referentiel.stock = preformatArray(referentiel.childrens, [
      'stock',
      'originalStock',
    ])

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
    }, 2000)
  }

  changeMonth(date: Date) {
    this.activitiesService.activityMonth.next(date)
  }

  onLoadMonthActivities() {
    this.activitiesService
      .loadMonthActivities(this.activityMonth)
      .then((monthValues) => {
        this.isLoadedFirst = true
        this.updatedBy = monthValues.lastUpdate
        const activities: ActivityInterface[] = monthValues.list

        if (monthValues.list.length === 0) {
          this.canEditActivities = false
        } else {
          this.canEditActivities = true
        }
        console.log(monthValues.list)

        const referentiels = [
          ...this.humanResourceService.contentieuxReferentiel.getValue(),
        ]

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

                return c
              })

              return ref
            })
        })
    }
  }
}
