import { Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { BehaviorSubject } from 'rxjs'

/**
 * Service de gestion des commentaires d'un magistrat, greffier....
 */
@Injectable({
  providedIn: 'root',
})
export class HRCommentService {
  /**
   * A comment is editing
   */
  mainEditing: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  /**
   * A comment is editing
   */
  forceOpenAll: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  /**
   * Constructeur
   * @param serverService
   * @param humanResourceService
   */
  constructor(private serverService: ServerService) {}

  /**
   * API appel au serveur pour récuperer le commentaire d'une fiche
   * @param id
   * @returns
   */
  getHRComment(id: number) {
    return this.serverService
      .post('hr-comment/get-hr-comment', {
        hrId: id,
      })
      .then((r) => r.data)
  }

  /**
   * API appel au serveur pour récuperer le commentaire d'une fiche
   * @param id
   * @returns
   */
  getHRCommentByCommentId(id: number, hrId: number) {
    return this.serverService
      .post('hr-comment/get-hr-comment-by-id', {
        id: id,
        hrId: hrId,
      })
      .then((r) => r.data)
  }
  /**
   * API mise à jour du commentaire d'une fiche
   * @param id
   * @param comment
   * @returns
   */
  updateHRComment(id: number, comment: string, userId: number, commentId: number = -1) {
    return this.serverService
      .post('hr-comment/update-hr-comment', {
        commentId,
        hrId: id,
        comment,
        userId: userId || -1,
      })
      .then((r) => {
        const updateAt = new Date(r.data)
        return updateAt
      })
  }

  /**
   * API suppression d'un commentaire
   */
  deleteHRComment(commentId: number, hrId: number) {
    return this.serverService.post('hr-comment/delete-hr-comment', {
      commentId,
      hrId,
    })
  }
}
