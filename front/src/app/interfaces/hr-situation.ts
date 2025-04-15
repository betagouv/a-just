import { HRCategoryInterface } from './hr-category';
import { HRFonctionInterface } from './hr-fonction';
import { RHActivityInterface } from './rh-activity';

/**
 * Un magistrat à une liste de situation
 */
export interface HRSituationInterface {
  /**
   * Id de la situation en base
   */
  id: number;
  /**
   * ETP allans de 0 à 1 ou null
   */
  etp: number | null;
  /**
   * Catégorie selectionnée
   */
  category: HRCategoryInterface | null;
  /**
   * Fonction selectionnée
   */
  fonction: HRFonctionInterface | null;
  /**
   * Date de début de cette situation
   */
  dateStart: Date;
  /**
   * Liste des contentieux pour cette situation
   */
  activities: RHActivityInterface[];
}
