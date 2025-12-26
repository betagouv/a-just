/**
 * Interface pour préparer une simulation
 */
export interface SimulationInterface {
  /**
   * Entrées moyenne
   */
  totalIn: number | null
  /**
   * Sorties moyenne
   */
  totalOut: number | null
  /**
   * Dernière valeure de stock
   */
  lastStock: number | null
  /**
   * ETP magistrat
   */
  etpMag: number | null
  /**
   * ETP Greffier
   */
  etpFon: number | null
  /**
   * ETP contractuel
   */
  etpCont: number | null
  /**
   * Pourcentage de couverture (entrees / sorties)
   */
  realCoverage: number | null
  /**
   * Valeur du DTES
   */
  realDTESInMonths: number | null
  /**
   * Tremps de traitement moyen des dossiers
   */
  magRealTimePerCase: number | null
  /**
   * Data mensualisé DTES STOCK IN OUT
   */
  monthlyReport?: any[] | null
}
