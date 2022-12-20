import { HRSituationInterface } from './hr-situation'
import { RHActivityInterface } from './rh-activity'

/**
 * Interface d'une resource
 */
export interface HumanResourceInterface {
  /**
   * Id de la base
   */
  id: number
  /**
   * Prénom
   */
  firstName?: string
  /**
   * Juridiction de rattachement
   */
  backupId?: number
  /**
   * Nom
   */
  lastName?: string
  /**
   * Matricule exterieur à l'outil
   */
  matricule?: string
  /**
   * Date d'arrivée en juridiction
   */
  dateStart?: Date
  /**
   * Date de départ de juridiction
   */
  dateEnd?: Date
  /**
   * Pourcentage total d'affectation à une date choisie
   */
  totalAffected?: number
  /**
   * Commentaire sur la personne
   */
  comment?: string
  /**
   * Liste des situations attribués
   */
  situations: HRSituationInterface[]
  /**
   * Liste des indispos
   */
  indisponibilities: RHActivityInterface[]
  /**
   * Date de dernière mise à jour
   */
  updatedAt: Date
}
