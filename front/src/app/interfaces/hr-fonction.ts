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
   * Position Titulaire Placé Cont
   */
  position: string;
  /**
   * Position Titulaire Placé Cont
   */
  calculatrice_is_active?: boolean;
  /**
   * Catégorie ratachée
   */
  categoryId: number;
  /**
   * Min date to be available
   */
  minDateAvalaible?: Date;
}
