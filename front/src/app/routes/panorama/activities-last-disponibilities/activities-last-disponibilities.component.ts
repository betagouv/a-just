import { Component, OnDestroy, OnInit } from '@angular/core'
import { BackupInterface } from 'src/app/interfaces/backup'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { month } from 'src/app/utils/dates'

interface TagMonthInterface {
  month: Date
  active: boolean
  current: boolean
}

/**
 * Paneau des dernières activitiés
 */
@Component({
  selector: 'activities-last-disponibilities',
  templateUrl: './activities-last-disponibilities.component.html',
  styleUrls: ['./activities-last-disponibilities.component.scss'],
})
export class ActivitiesLastDisponibilitiesComponent
  extends MainClass
  implements OnInit, OnDestroy
{
  /**
   * Liste of months
   */
  months: TagMonthInterface[] = []

  /**
   * Constructor
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService
  ) {
    super()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnInit() {
    const now = new Date()
    const nbMonth = 12

    for (let i = 0; i < nbMonth; i++) {
      this.months.push({
        month: new Date(now.getFullYear(), i, 10),
        active: false,
        current: false,
      })
    }

    this.watch(
      this.humanResourceService.hrBackup.subscribe(
        (hrBackup: BackupInterface | null) => {
          if (hrBackup) {
            this.activitiesService.getLastMonthActivities().then((date) => {
              let max = null

              if (date !== null) {
                date = new Date(date ? date : '')
                max = month(date, 0, 'lastday')
              }
              this.updateMonthActivity(max)
            })
          } else {
            this.updateMonthActivity()
          }
        }
      )
    )
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Update date activities
   * @param maxDate
   */
  updateMonthActivity(maxDate: Date | null = null) {
    for (let i = 0; i < this.months.length; i++) {
      const m = this.months[i].month
      this.months[i].active = maxDate && maxDate.getFullYear() >= m.getFullYear() && maxDate.getMonth() > m.getMonth() ? true : false
      this.months[i].current = maxDate && maxDate.getFullYear() === m.getFullYear() && maxDate.getMonth() === m.getMonth() ? true : false
    }
  }
}