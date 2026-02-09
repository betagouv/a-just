import { ContentieuReferentielInterface } from './contentieu-referentiel'

/**
 * Interface d'un ETP
 */
export interface etpAffectedInterface {
  /**
   * Nom de l'interface
   */
  name: string
  /**
   * Somme de l'ETP
   */
  totalEtp: number
  /**
   * Ordre de l'ETP
   */
  rank: number
}

/**
 * Interface du résultat d'un calcul
 */
export interface CalculatorInterface {
  /**
   * Dernière mise à jour des ventilations
   */
  lastVentilationUpdatedAt: Date | string | null
  /**
   * Dernière mise à jour des activités
   */
  lastActivityUpdatedAt: Date | string | null
  /**
   * Entrées moyennes
   */
  totalIn: number | null
  /**
   * Entrées moyennes after
   */
  totalInAf: number | null
  /**
   * Entrées moyennes before
   */
  totalInBf: number | null
  /**
   * Sorties moyennes
   */
  totalOut: number | null
  /**
   * Sorties moyennes after
   */
  totalOutAf: number | null
  /**
   * Sorties moyennes before
   */
  totalOutBf: number | null
  /**
   * Dernière valeure de stock
   */
  lastStock: number | null
  /**
   * Dernière valeure de stock after
   */
  lastStockAf: number | null
  /**
   * Dernière valeure de stock before
   */
  lastStockBf: number | null
  /**
   * Calcul des ETP magistrat sur la période
   */
  etpMag: number | null
  /**
   * Calcul des ETP magistrat sur la période after
   */
  etpMagAf: number | null
  /**
   * Calcul des ETP magistrat sur la période before
   */
  etpMagBf: number | null
  /**
   * Temps de traitement réel des magistrats
   */
  magRealTimePerCase: number | null
  /**
   * Temps de traitement calculé des magistrats
   */
  magCalculateTimePerCase: number | null
  /**
   * Sorties estimées des magistrats
   */
  magCalculateOut: number | null
  /**
   * Couverture des entres / sorties des magistrats
   */
  magCalculateCoverage: number | null
  /**
   * Delai avant la cloture des dossiers par les magistrats
   */
  magCalculateDTESInMonths: number | null
  /**
   * ETP Fonctionnaires
   */
  etpFon: number | null
  /**
   * ETP Fonctionnaires after
   */
  etpFonAf: number | null
  /**
   * ETP Fonctionnaires before
   */
  etpFonBf: number | null
  /**
   * Temps de traitement réel des fonctionnaires
   */
  fonRealTimePerCase: number | null
  /**
   * Temps de traitement calculé des fonctionnaires
   */
  fonCalculateTimePerCase: number | null
  /**
   * Sorties estimées des fonctionnaires
   */
  fonCalculateOut: number | null
  /**
   * Delai avant la cloture des dossiers par les fonctionnaires
   */
  fonCalculateCoverage: number | null
  /**
   * Delai avant la cloture des dossiers par les fonctionnaires
   */
  fonCalculateDTESInMonths: number | null
  /**
   * ETP Contractuel
   */
  etpCont: number | null
  /**
   * ETP Contractuel before
   */
  etpContBf: number | null
  /**
   * ETP Contractuel after
   */
  etpContAf: number | null
  /**
   * Couverture global
   */
  realCoverage: number | null
  /**
   * Couverture global before
   */
  realCoverageBf: number | null
  /**
   * Couverture global after
   */
  realCoverageAf: number | null
  /**
   * DTES glbal
   */
  realDTESInMonths: number | null
  /**
   * DTES au début
   */
  realDTESInMonthsStart: number | null
  /**
   * Contentieux rataché
   */
  contentieux: ContentieuReferentielInterface
  /**
   * Nombre de mois selectionnés
   */
  nbMonth: number
  /**
   * Resultats des calculs des enfants d'un contientieux
   */
  childrens: CalculatorInterface[]
  /**
   * ETP global
   */
  etpAffected: etpAffectedInterface[]
  /**
   * Affiche ou non les enfants d'un resultat sur la page calculateur
   */
  childIsVisible: boolean
}
