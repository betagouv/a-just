import { BackupInterface } from './backup'

/**
 * Interface d'un groupe de juridiction
 */
export interface JuridictionGroupInterface {
  /**
   * Id de la base
   */
  id?: number
  /**
   * Nom du groupe
   */
  label?: string
  /**
   * Liste des juridictions du groupe
   */
  backups?: BackupInterface[]
  /**
   * L'utilisateur a accès à toutes les juridictions actives du groupe
   */
  fullAccess?: boolean
  /**
   * Is admin local
   */
  isAdminLocal?: boolean
}
