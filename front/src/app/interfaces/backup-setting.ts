/**
 * Setting d'un backup
 */
export interface BackupSettingInterface {
  /**
   * Id de la base
   */
  id: number;
  /**
   * Nom
   */
  label: string;
  /**
   * Type
   */
  type: string;
  /**
   * Datas enregistrée
   */
  datas: any;
  /**
   * Date de création
   */
  createdAt: Date;
  /**
   * Dernière date de modification
   */
  updatedAt: Date;
}