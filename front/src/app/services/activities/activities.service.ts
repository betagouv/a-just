import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { ActivityInterface } from 'src/app/interfaces/activity'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { ServerService } from '../http-server/server.service'

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  activities: BehaviorSubject<ActivityInterface[]> = new BehaviorSubject<
    ActivityInterface[]
  >([])
  activityMonth: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date())
  hrBackupId: number | null = null

  constructor(private serverService: ServerService) {}

  updateDatasAt(contentieuxId: number, date: Date, values: any) {
    return this.serverService
      .postWithoutError(`activities/update-by`, {
        contentieuxId,
        date,
        values,
        hrBackupId: this.hrBackupId,
      })
      .then(() => {
        // quick fix to remove after calcul moved to back
        this.loadAllActivities()
      })
  }

  getActivitiesByDate(date: Date) {
    let activities = this.activities.getValue()
    activities = activities.filter(
      (a) =>
        a.periode.getMonth() === date.getMonth() &&
        a.periode.getFullYear() === date.getFullYear()
    )

    return activities
  }

  loadMonthActivities(date: Date) {
    return this.serverService
      .post(`activities/get-by-month`, {
        date,
        hrBackupId: this.hrBackupId,
      })
      .then((data) => data.data || null)
  }

  loadAllActivities() {
    return this.serverService
      .post(`activities/load-all-activities`, {
        hrBackupId: this.hrBackupId,
      })
      .then((data) => {
        const list = data.data
        this.activities.next(
          list.map((a: ActivityInterface) => ({
            ...a,
            periode: new Date(a.periode),
          }))
        )
      })
  }
}
