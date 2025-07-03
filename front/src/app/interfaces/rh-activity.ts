import { ContentieuReferentielInterface } from './contentieu-referentiel'

/**
 * Interface de la liste des activités
 */
export interface RHActivityInterface {
  /**
   * Id en base
   */
  id: number
  /**
   * Nom du contentieux
   */
  label?: string
  /**
   * Pourcentage lié au contentieux
   */
  percent: number
  /**
   * Id du contentieux
   */
  referentielId?: number
  /**
   * Date de début, quand il y en a
   */
  dateStart?: Date
  /**
   * Date de fin, quand il y en a
   */
  dateStop?: Date
  /**
   * Contentieux au complet
   */
  contentieux: ContentieuReferentielInterface
  /**
   * Etat transitoir de demande de suppression d'une ventilation
   */
  isDeleted?: boolean
  /**
   * Date de création
   */
  createdAt?: Date
  /**
   * Date de mise à jour
   */
  updatedAt?: Date
}
