/**
 * Interface d'un item d'une list du composant list-selection
 */
export interface ItemInterface {
	/**
	 * Id propre à l'item
	 */
	id: string | number;
	/**
	 * Champ visible
	 */
	label: string;
	/**
	 * Icon à afficher à gauche
	 */
	icon?: string;
}
