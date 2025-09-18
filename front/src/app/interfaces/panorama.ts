import { HRCategorySelectedInterface } from './hr-category'
/**
 * Interface pour les données effectifs à afficher sur le panorama
 */
export interface IWorkforcePanorama {
  /**
   * Catégorie de la juridiction
   */
  siege: HRCategorySelectedInterface
  /**
   * Catégorie de la greffe
   */
  greffe: HRCategorySelectedInterface
  /**
   * Catégorie de l'EAM
   */
  eam: HRCategorySelectedInterface
}
