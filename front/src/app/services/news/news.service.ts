import { Injectable } from '@angular/core'
import { NewsInterface } from 'src/app/interfaces/news'
import { ServerService } from '../http-server/server.service'

/**
 * Liste des news pour les utilisateurs
 */

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  /**
   * Constructeur
   * @param serverService
   */
  constructor(private serverService: ServerService) {}

  /**
   * API qui permet retourner la news propre à une personne
   * @returns
   */
  getLast(): Promise<NewsInterface> {
    return this.serverService.get(`news/last`).then((d) => d.data)
  }

  /**
   * API qui trace le clique utilisateur
   */
  updateNewsOnClick(id: number) {
    return this.serverService.post(`news/on-close`, { id })
  }
}
