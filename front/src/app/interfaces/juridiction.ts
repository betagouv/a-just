/**
 * Interface d'une juridiction
 */
export interface JuridictionInterface {
  /**
   * Id de la juridiction
   */
  id: number
  /**
   * Nom de la juridiction
   */
  label: string
  /**
   * Code ELST de la juridiction
   */
  iElst?: string
  /**
   * Latitude de la juridiction
   */
  latitude?: number
  /**
   * Longitude de la juridiction
   */
  longitude?: number
  /**
   * Population de la juridiction
   */
  population?: number
  /**
   * Si la juridiction est activée
   */
  enabled?: boolean
}
