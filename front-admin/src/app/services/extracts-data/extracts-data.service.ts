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

  extractdata({backupId, dateStart, dateStop} : {backupId: number, dateStart: Date, dateStop: Date}) {

    return this.serverService.post(`extractor/filter-list-act`, {
      backupId,
      dateStart,
      dateStop,
    })
  }
}
