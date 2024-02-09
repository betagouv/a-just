import { ContentieuReferentielInterface } from './contentieu-referentiel'
import { UserInterface } from './user-interface'

/**
 * Entrées / Sorties / Stock d'un contentieux à un mois donnée
 */
export interface ActivityInterface {
  /**
   * Mois d'une activité
   */
  periode: Date
  /**
   * Entrées d'une activité
   */
  entrees: number
  /**
   * Entrées venant de la SDSE
   */
  originalEntrees?: number
  /**
   * Sorties d'une activité
   */
  sorties: number
  /**
   * Sorties venant de la SDSE
   */
  originalSorties?: number
  /**
   * Stock calculé
   */
  stock: number
  /**
   * Stock de la SDSE
   */
  originalStock?: number
  /**
   * Contentieux concerné
   */
  contentieux: ContentieuReferentielInterface
  /**
   * Node qui précise qui à mise à jour et quand
   */
  updatedBy?: NodeActivityUpdatedInterface
}


  /**
   * Node qui précise qui à mise à jour et quand
   */
export interface NodeActivityUpdatedInterface {
  /**
   * Utilisateur plus sa date de mise à jour
   */
  entrees: { user: UserInterface | null; date: Date } | null
  /**
   * Utilisateur plus sa date de mise à jour
   */
  sorties: { user: UserInterface | null; date: Date } | null
  /**
   * Utilisateur plus sa date de mise à jour
   */
  stock: { user: UserInterface | null; date: Date } | null
}
