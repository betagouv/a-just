import { etpAffectedInterface } from './calculator'

/**
 * Interface du resultat d'une simulation
 */
export interface SimulatorInterface {
  /**
   * Entrées
   */
  totalIn: number | null
  /**
   * Sorties
   */
  totalOut: number | null
  /**
   * Dernier stock
   */
  lastStock: number | null
  /**
   * ETP magistrat
   */
  etpMag: number | null
  /**
   * ETP fonctionnaire
   */
  etpFon: number | null
  /**
   * ETP contractuel
   */
  etpCont: number | null
  /**
   * Taux de couverture
   */
  realCoverage: number | null
  /**
   * DTES
   */
  realDTESInMonths: number | null
  /**
   * TMD magistrat
   */
  magRealTimePerCase: number | null
  /**
   * Taux de couverture magistrat
   */
  magCalculateCoverage: number | null
  /**
   * Taux de couverture fonctionnaire
   */
  fonCalculateCoverage: number | null
  /**
   * DTES magistrat
   */
  magCalculateDTESInMonths: number | null
  /**
   * DTES fonctionnaire
   */
  fonCalculateDTESInMonths: number | null
  /**
   * TMD calculé magistrat
   */
  magCalculateTimePerCase: number | null
  /**
   * Nombre de mois
   */
  nbMonth: number
  /**
   * Valeur ETP brut retourné par le back
   */
  etpAffected: etpAffectedInterface[] | null
  /**
   * Données d'ETP utilisé pour les calculs
   */
  etpToCompute?: number | null
  /**
   * Données mensuelles servant à alimenter les graphiques
   */
  monthlyReport?: any[] | null
}
