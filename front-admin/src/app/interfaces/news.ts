import { Color } from "@angular-material-components/color-picker";

/**
 * Interface pour afficher un bandeau news
 */
export interface NewsInterface {
	/**
	 * Id de la base
	 */
	id: number;
	/**
	 * Texte du message
	 */
	html: string;
	/**
	 * Icon
	 */
	icon?: string;
	/**
	 * Background color
	 */
	backgroundColor?: string | Color;
	/**
	 * Text color
	 */
	textColor?: string | Color;
	/**
	 * Temps de fermeture automatique
	 */
	delayBeforeAutoClosing?: number;
	/**
	 * Action button text
	 */
	actionButtonText?: string;
	/**
	 * Action button url
	 */
	actionButtonUrl?: string;
	/**
	 * Action button color
	 */
	actionButtonColor?: string | Color;
	/**
	 * Date de début
	 */
	dateStart?: Date;
	/**
	 * Date de fin
	 */
	dateStop?: Date;
	/**
	 * Actif ou non
	 */
	enabled: boolean;
}