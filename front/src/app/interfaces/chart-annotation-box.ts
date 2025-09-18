/**
 * Interface de synchronisation de popin des graphiques du simulateur
 */
export interface ChartAnnotationBoxInterface {
  /**
   * Affichage de la popin
   */
  display?: boolean
  /**
   * Abscisse min
   */
  xMin?: number | null
  /**
   * Abscisse max
   */
  xMax?: number | null
  /**
   * Contenu de la popin
   */
  content?: string | undefined
  /**
   * Valeur projetée magistrat
   */
  projectedMag?: number | null
  /**
   * Valeur simulée magistrat
   */
  simulatedMag?: number | null
  /**
   * Valeur projetée fonctionnaire
   */
  projectedFon?: number | null
  /**
   * Valeur simulée EAM
   */
  simulatedCont?: number | null
  /**
   * Valeur projetée EAM
   */
  projectedCont?: number | null
  /**
   * Valeur simulée fonctionnaire
   */
  simulatedFon?: number | null
  /**
   * Valeur de stock projetée
   */
  projectedStock?: number | null
  /**
   * Valeur de stock simulée
   */
  simulatedStock?: number | null
  /**
   * Abscisse popin
   */
  x?: number | null
  /**
   * Ordonné popin
   */
  y?: number | null
  /**
   * Abscisse after element
   */
  trianglex?: number | null
  /**
   * Ordonné after element
   */
  triangley?: number | null
  /**
   * Indice du mois selectionné
   */
  pointIndex?: number | null
  /**
   * DTES projeté
   */
  projectedDTES?: number | null
  /**
   * DTES simulé
   */
  simulatedDTES?: number | null
  /**
   * Entrées projetées
   */
  projectedIn?: number | null
  /**
   * Entrées simulées
   */
  simulatedIn?: number | null
  /**
   * Sorties projetées
   */
  projectedOut?: number | null
  /**
   * Sorties simulées
   */
  simulatedOut?: number | null
  /**
   * Mois selectionné
   */
  selectedLabelValue?: string | null
  /**
   * Affichage des tooltips au survol de la souris
   */
  enableTooltip?: boolean | null
}
