import { inject, Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'

/**
 * Service des KPI
 */
@Injectable({
  providedIn: 'root',
})
export class KPIService {
  /**
   * Service de communication avec le serveur
   */
  serverService = inject(ServerService)

  /**
   * API de sauvegarde d'une action
   * @param params
   * @returns
   */
  register(codeId: number, value: string = ''): Promise<any> {
    return this.serverService.post('kpi/call', { type: codeId, value })
  }
}
