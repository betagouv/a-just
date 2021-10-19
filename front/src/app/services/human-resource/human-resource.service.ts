import { Injectable } from '@angular/core'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { ServerService } from '../http-server/server.service'

@Injectable({
  providedIn: 'root',
})
export class HumanResourceService {
  constructor (
    private serverService: ServerService
  ) {}

  getCurrentHR () {
    return this.serverService.get('human-resources/get-current-hr').then(r => r.data || [])
  }
}
