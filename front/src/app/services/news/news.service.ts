import { inject, Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { NewsInterface } from '../../interfaces/news'

/**
 * Clé de token du local storage
 */
const NEWS_TOKEN = 'news-token-closes'

/**
 * Liste des news pour les utilisateurs
 */

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  /**
   * Service de communication avec le serveur
   */
  serverService = inject(ServerService)

  /**
   * API qui permet retourner la news propre à une personne
   * @returns
   */
  getLast(): Promise<NewsInterface> {
    return this.serverService.getWithoutError(`news/last`).then((d) => {
      const news = d.data

      if (news && news.id && !this.hasClose(news.id)) {
        return news
      }

      return null
    })
  }

  /**
   * API qui trace le clique utilisateur
   */
  updateNewsOnClick(id: number) {
    this.addIdMemorise(id)
    //return this.serverService.post(`news/on-close`, { id })
  }

  /**
   * Liste des ids déjà cliqué
   * @returns
   */
  getIdsSelected() {
    const ls = localStorage.getItem(NEWS_TOKEN)
    const ids = ls ? (JSON.parse(ls) as number[]) : []

    return ids
  }

  /**
   * Ajouter un id à la liste
   * @returns
   */
  addIdMemorise(id: number) {
    const ids = this.getIdsSelected()

    if (ids.indexOf(id) === -1) {
      ids.push(id)
      localStorage.setItem(NEWS_TOKEN, JSON.stringify(ids))
    }
  }

  /**
   * Has already close
   * @returns
   */
  hasClose(id: number) {
    const ids = this.getIdsSelected()

    return ids.indexOf(id) !== -1
  }
}
