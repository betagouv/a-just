/**
 * Interface pour afficher une message d'alert
 */
export interface CalculatriceInterface {
  /**
   * Donnée de vacation
   */
  vacation: {
    /**
     * Valeur en nombre de vacation
     */
    value: string | null
    /**
     * Période semaine mois année
     */
    option: string | null
    /**
     * Valeur d'une vacation en heure
     */
    unit: string | null
  }
  /**
   * Volume
   */
  volume: {
    /**
     * Valeur en nombre d'heure
     */
    value: string | null
    /**
     * Période semaine mois année
     */
    option: string | null
  }
  /**
   * Type de calcul
   */
  selectedTab: string
}
