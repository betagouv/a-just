/**
 * Catégories des personnes (magistrats, greffier ....)
 */
export interface HRCategoryInterface {
  /**
   * Id de la base
   */
	id: number;
  /**
   * Nom
   */
	label: string;
  /**
   * Ordre pour trier en base
   */
	rank?: number;
  /**
   * Couleur du texte de la catégorie
   */
	textColor: string;
  /**
   * Couleur de fond de la catégorie
   */
	bgColor: string;
}

/**
 * Catégorie selectionnée pour une page
 */
export interface HRCategorySelectedInterface extends HRCategoryInterface {
  /**
   * Selectionnée ou non
   */
  selected: boolean;
  /**
   * Somme des ETPT calculé
   */
  etpt: number;
  /**
   * Nom de personne de la catégorie
   */
  nbPersonal: number;
  /**
   * String pour afficher au pluriel ou non
   */
  labelPlural: string;
}
