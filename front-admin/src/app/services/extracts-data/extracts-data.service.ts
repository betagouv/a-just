import { Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'

@Injectable({
  providedIn: 'root',
})
export class ExtractsDataService {
  constructor (
    private serverService: ServerService
  ) {}

  generalizeTimeZone(date: Date | undefined | null) {
    if (date === undefined || date ===null) return undefined
    else {
      return date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    }
  }

  /**
   * LIste des juridictions ayant ajusté leur données d'activité
   */
  getJuridictionAjusted({dateStart, dateStop} : {dateStart: Date, dateStop: Date}) {
    console.log('[exrtractData][line 20] ')
    return this.serverService.post(`extractor/juridiction-ajusted-data-list` , { dateStart, dateStop }).then(res => console.log('res:', res)).catch(err => console.log('err:', err))
  }

  extractdata({backupId, dateStart, dateStop} : {backupId: number, dateStart: Date, dateStop: Date}) {
    return this.serverService.post(`extractor/filter-list-act`, {
      backupId,
      dateStart,
      dateStop,
    })
  }
}
