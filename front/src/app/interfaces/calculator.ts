import { ContentieuReferentielInterface } from "./contentieu-referentiel";

/**
 * Interface d'un ETP
 */
export interface etpAffectedInterface {
	/**
	 * Nom de l'interface
	 */
	name: string;
	/**
	 * Somme de l'ETP
	 */
  totalEtp: number;
	/**
	 * Ordre de l'ETP
	 */
  rank: number;
}

/**
 * Interface du résultat d'un calcul
 */
export interface CalculatorInterface {
	/**
	 * Entrées moyennes
	 */
	totalIn: number | null;
	/**
	 * Sorties moyennes
	 */
	totalOut: number | null;
	/**
	 * Dernière valeure de stock
	 */
	lastStock: number | null;
	/**
	 * Calcul des ETP magistrat sur la période
	 */
	etpMag: number | null;
	/**
	 * Temps de traitement réel des magistrats
	 */
	magRealTimePerCase: number | null;
	/**
	 * Temps de traitement calculé des magistrats
	 */
	magCalculateTimePerCase: number | null;
	/**
	 * Sorties estimées des magistrats
	 */
	magCalculateOut: number | null;
	/**
	 * Couverture des entres / sorties des magistrats
	 */
	magCalculateCoverage: number | null;
	/**
	 * Delai avant la cloture des dossiers par les magistrats
	 */
	magCalculateDTESInMonths: number | null;
	/**
	 * ETP Fonctionnaires
	 */
	etpFon: number | null;
	/**
	 * Temps de traitement réel des fonctionnaires
	 */
	fonRealTimePerCase: number | null;
	/**
	 * Temps de traitement calculé des fonctionnaires
	 */
	fonCalculateTimePerCase: number | null;
	/**
	 * Sorties estimées des fonctionnaires
	 */
	fonCalculateOut: number | null;
	/**
	 * Delai avant la cloture des dossiers par les fonctionnaires
	 */
	fonCalculateCoverage: number | null;
	/**
	 * Delai avant la cloture des dossiers par les fonctionnaires
	 */
	fonCalculateDTESInMonths: number | null;
	/**
	 * ETP Contractuel
	 */
	etpCont: number | null;
	/**
	 * Couverture global
	 */
	realCoverage: number | null;
	/**
	 * DTES glbal
	 */
	realDTESInMonths: number | null;
	/**
	 * DTES au début
	 */
	realDTESInMonthsStart: number | null;
	/**
	 * Contentieux rataché
	 */
	contentieux: ContentieuReferentielInterface;
	/**
	 * Nombre de mois selectionnés
	 */
	nbMonth: number;
	/**
	 * Resultats des calculs des enfants d'un contientieux
	 */
	childrens: CalculatorInterface[];
	/**
	 * ETP global
	 */
	etpAffected: etpAffectedInterface[];
	/**
	 * Affiche ou non les enfants d'un resultat sur la page calculateur
	 */
	childIsVisible: boolean;
}
