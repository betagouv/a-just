import { Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'

@Injectable({
  providedIn: 'root',
})
export class ContentieuxOptionsService {
  constructor (
    private serverService: ServerService
  ) {}

  getAll() {
    return this.serverService.get('contentieux-options/get-all-admin').then(data => data.data);
  }

  updateBackup(params: any) {
    return this.serverService.post('contentieux-options/update-backup', params);
  }
}
