import { inject, Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'

/**
 * Service de gestion des commentaires globaux
 */
@Injectable({
  providedIn: 'root',
})
export class CommentService {
  /**
   * Service d'appel au serveur
   */
  serverService = inject(ServerService)
  /**
   * Service de gestion des ressources
   */
  humanResourceService = inject(HumanResourceService)

  /**
   * API appel au serveur pour récuperer les commentaires en fonction d'un type
   * @param type
   * @returns
   */
  getComments = async (type: string) =>
    (
      await this.serverService.post('comment/get-comments', {
        type,
        juridictionId: this.humanResourceService.backupId.getValue(),
      })
    )?.data || []

  /**
   * API mise à jour d'un commentaire
   * @param type
   * @param comment
   * @param commentId
   * @returns
   */
  updateComment = async (type: string, comment: string, commentId: number | null = null) =>
    this.serverService.post('comment/update-comment', {
      type,
      juridictionId: this.humanResourceService.backupId.getValue(),
      commentId,
      comment,
    })

  /**
   * API suppression d'un commentaire
   */
  deleteComment = async (commentId: number) =>
    this.serverService.post('comment/delete-comment', {
      commentId,
      juridictionId: this.humanResourceService.backupId.getValue(),
    })
}
