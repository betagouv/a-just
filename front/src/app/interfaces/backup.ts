/**
 * Interface des sauvegardes (Juridictions / Temps moyens par dossier ...)
 */
export interface BackupInterface {
	/**
	 * Id de sauvegarde
	 */
	id: number;
	/**
	 * Intitulé de sauvegarde
	 */
	label: string;
	/**
	 * Date de dernière mise à jour de lui ou de ses enfants
	 */
	date: Date;
}
