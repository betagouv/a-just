/**
 * Fonctions (1VP, VP, P....)
 */
export interface HRFonctionInterface {
	/**
	 * Id de la base
	 */
	id: number;
	/**
	 * Version raccoursi de la fonction (VP)
	 */
	code?: string;
	/**
	 * Nom de la fonction (Vice président)
	 */
	label: string;
	/**
	 * Position pour trier en base
	 */
	rank?: number;
	/**
	 * Catégorie ratachée
	 */
	categoryId: number;
}
