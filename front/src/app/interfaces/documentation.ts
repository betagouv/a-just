/**
 * Interface liée à la documentation d'une page "Comment ça marche"
 */
export interface DocumentationInterface {
  /**
   * Titre dans les paneaux
   */
  title: string;
  /**
   * Affichage du sous-titre ou non
   */
  printSubTitle: boolean,
  /**
   * Sous titre dans les paneaux
   */
  subTitle?: string;
  /**
   * Lien de la doc à mettre en iframe
   */
  path: string;
  /**
   * Couler du background 
   */
  bgColor?: string;
}