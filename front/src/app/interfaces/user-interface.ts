/**
 * Interface d'un utilisateur connecté
 */
export interface UserInterface {
  /**
   * Id de la base
   */
  id?: number
  /**
   * Email de connection
   */
  email?: string
  /**
   * Role (1 admin, 0 user)
   */
  role?: number
  /**
   * Compte bloqué ou non
   */
  status?: number
  /**
   * Prénom utilisateur
   */
  firstName?: string
  /**
   * Nom utilisateur
   */
  lastName?: string
  /**
   * initials
   */
  initials?: string
  /**
   * Token de connection généré par JWT
   */
  token?: string
  /**
   * Liste des pages sur lequels il a accès
   */
  access?: number[]
  /**
   * Liste des referentiels sur lequels il a accès
   */
  referentielIds?: number[]
}
