import { inject, Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { HRCategoryInterface } from '../../interfaces/hr-category'

/**
 * Service d'appel au serveur des différentes catégories existantes.
 * Exemple : Magistrat, Greffier....
 */
@Injectable({
  providedIn: 'root',
})
export class HRCategoryService {
  /**
   * Service de communication avec le serveur
   */
  serverService = inject(ServerService)
  /**
   * Liste des catégories gardés en cache
   */
  categories: HRCategoryInterface[] = []

  /**
   * Appel au serveur pour récupérer la liste de toutes les catégories
   * @returns
   */
  getAll(): Promise<HRCategoryInterface[]> {
    if (this.categories.length) {
      return new Promise((resolve) => {
        resolve(this.categories)
      })
    }

    return this.serverService
      .get('hr-categories/get-all')
      .then((r) => r.data || [])
      .then((list) => {
        this.categories = list
        return list
      })
  }
}
