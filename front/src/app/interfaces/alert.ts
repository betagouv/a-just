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
	/**
	 * Callback on click to ok
	 */
	callback?: Function;
	/**
	 * Texte du bouton de fermeture
	 */
	okText?: string;
	/**
	 * Callback on click to second bt
	 */
	callbackSecondary?: Function;
	/**
	 * Texte du bouton secondaire
	 */
	secondaryText?: string;
	/**
	 * Class spécifique à la popin
	 */
	classPopin?: string;
}