/**
 * Interface pour
 */
export interface DateSelectorinterface {
  /**
   * Titre du bouton
   */
  title: string
  /**
   * Type de date
   */
  dateType: string
  /**
   * Valeur de la date
   */
  value: Date | string | undefined | null
  /**
   * Date minimale
   */
  minDate?: Date
  /**
   * Affiche l'arrow
   */
  showArrow: boolean
}
