import { UserInterface } from './user-interface'

/**
 * Commnentaire de l'app
 */
export interface CommentInterface {
  /**
   * identifiant du commentaire
   */
  id: number
  /**
   * Commentaire
   */
  comment: string
  /**
   * type
   */
  type: string
  /**
   * Date de création
   */
  createdAt: Date
  /**
   * Date de dernière modification
   */
  updatedAt: Date
  /**
   * Personne qui a éditer
   */
  editor: UserInterface
}
