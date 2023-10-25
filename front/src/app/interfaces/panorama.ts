import { HRCategorySelectedInterface } from "./hr-category"
/**
  * Interface pour les données effectifs à afficher sur le panorama
  */
export interface IWorkforcePanorama {
  siege: HRCategorySelectedInterface,
  greffe: HRCategorySelectedInterface,
  eam: HRCategorySelectedInterface,
}