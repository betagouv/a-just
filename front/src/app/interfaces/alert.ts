/**
 * Interface pour afficher une message d'alert
 */
export interface AlertInterface {
	/**
	 * Titre du message d'alert
	 */
	title?: string;
	/**
	 * Texte du message d'alert
	 */
	text: string;
	/**
	 * Optionnel saisie d'un temps de fermeture automatique
	 */
	delay?: number;
}