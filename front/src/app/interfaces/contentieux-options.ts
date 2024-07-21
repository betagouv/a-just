import { ContentieuReferentielInterface } from './contentieu-referentiel'

/**
 * Interface des contentieux options, comprend les temps moyens par dossier. Option car ce sont des plus lée à un contentieux en prévision de plus d'option
 */
export interface ContentieuxOptionsInterface {
  /**
   * Id de l'option dans la base
   */
  id?: number
  /**
   * Temps moyens saisi des magistrats
   */
  averageProcessingTime: number | null
  /**
   * Contentieux qui est relié
   */
  contentieux: ContentieuReferentielInterface
}
