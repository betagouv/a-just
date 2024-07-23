import { ContentieuReferentielInterface } from "./contentieu-referentiel";
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
	 * Status local ou importé
	 */
	status: string;
	/**
	 * Type siege ou greffe
	 */
	type: string;
	/**
	 * Date de création
	 */
	date: Date;
	/**
 * Date de dernière mise à jour de lui ou de ses enfants
 */
	update: UpdateInterface;
	/**
	 * Interface du référentiel associé à la juridiction = contentieux
	 */
	referentiels: ContentieuReferentielInterface[]
	/**
	 * Nom du créateur du referentiel
	 */
	userName?: string
}

export interface UpdateInterface {
	date: Date;
	user: Object;
}
