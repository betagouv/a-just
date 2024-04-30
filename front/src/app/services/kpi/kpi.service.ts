import { Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'

/**
 * Service des KPI
 */
@Injectable({
  providedIn: 'root',
})
export class KPIService {
  /**
   * Constructeur
   * @param serverService
   */
  constructor(private serverService: ServerService) {}

  /**
   * API de sauvegarde d'une action
   * @param params
   * @returns
   */
  register(codeId: number, value: string): Promise<any> {
    return this.serverService.post('kpi/call', { type: codeId, value })
  }
}
