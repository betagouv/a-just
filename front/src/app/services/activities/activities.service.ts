import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { ActivityInterface } from 'src/app/interfaces/activity'
import { setTimeToMidDay } from 'src/app/utils/dates'
import { ServerService } from '../http-server/server.service'

/**
 * Traitement des Activitiés (entrées, sorties, stock) avec le serveur
 */

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  /**
   * List de l'ensemble des activités
   */
  activities: BehaviorSubject<ActivityInterface[]> = new BehaviorSubject<
    ActivityInterface[]
  >([])
  /**
   * Mois en cour
   */
  activityMonth: BehaviorSubject<Date | null> = new BehaviorSubject<Date | null>(null)
  /**
   * Id de la juridiction
   */
  hrBackupId: number | null = null

  /**
   * Constructeur
   * @param serverService 
   */
  constructor(private serverService: ServerService) {}

  /**
   * API qui permet de mettre à jour l'entrée, sorties et stock d'un contentieux à un mois donnée
   * @param contentieuxId 
   * @param date 
   * @param values 
   * @param nodeUpdated l'entrée ou la sortie ou stock mis à jour
   * @returns 
   */
  updateDatasAt(contentieuxId: number, date: Date, values: any, nodeUpdated: string) {
    return this.serverService
      .postWithoutError(`activities/update-by`, {
        contentieuxId,
        date:setTimeToMidDay(date),
        values,
        hrBackupId: this.hrBackupId,
        nodeUpdated,
      })
  }

  /**
   * Filtre des activitiés pour un mois donnée
   * @param date 
   * @returns 
   */
  getActivitiesByDate(date: Date) {
    let activities = this.activities.getValue()
    activities = activities.filter(
      (a) =>
        a.periode.getMonth() === date.getMonth() &&
        a.periode.getFullYear() === date.getFullYear()
    )

    return activities
  }

  /**
   * API appel au serveur pour la liste des activités d'un mois à une juridiction
   * @param date 
   * @returns 
   */
  loadMonthActivities(date: Date) {
    return this.serverService
      .post(`activities/get-by-month`, {
        date:setTimeToMidDay(date),
        hrBackupId: this.hrBackupId,
      })
      .then((data) => data.data || null)
  }

  /**
   * API retourne le dernier mois qui possède une activité pour une juridiction
   * @returns 
   */
  getLastMonthActivities() {
    return this.serverService
      .post(`activities/get-last-month`, {
        hrBackupId: this.hrBackupId,
      })
      .then((data) => data.data.date || null)
  }
}
