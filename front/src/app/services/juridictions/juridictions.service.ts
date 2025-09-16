import { inject, Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { JuridictionInterface } from '../../interfaces/juridiction'

/**
 * Service de gestion des juridictions
 */
@Injectable({
  providedIn: 'root',
})
export class JuridictionsService {
  /**
   * Service de communication avec le serveur
   */
  serverService = inject(ServerService)

  /**
   * Récupération des juridictions visibles
   */
  getAllVisible(): Promise<JuridictionInterface[]> {
    return this.serverService.get('juridictions/get-all-visibles').then((data) => data.data || [])
  }
}
