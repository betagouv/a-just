import { NodeActivityUpdatedInterface } from "./activity"

export enum ValueQualityEnum {
  ptional = "facultatif",
  good = "good",
  toComplete = "to_complete",
  toVerify = "to_verify",
}

/**
 * Interface du référentiel = contentieux
 */
export interface ContentieuReferentielInterface {
  /**
   * Id d'un contentieux
   */
  id: number
  /**
   * Nom des contentieux
   */
  label: string
  /**
   * Contentieux niveau 4
   */
  childrens?: ContentieuReferentielInterface[]
  /**
   *  Taux de completion de la donnée
   */
  completion?: number
  /**
   * Element à compter ou non dans le calcul de complétion des données
   */
  compter?: boolean
  /**
   * Somme des ETP du contentieux
   */
  totalAffected?: number
  /**
   * Pourcentage d'affectation
   */
  percent?: number
  /**
   * Si c'est selectionnée
   */
  selected?: boolean
  /**
   * Rank pour le trie
   */
  rank?: number
  /**
   * Entrées 
   */
  in?: number | null
  /**
   * Entrées envoyées de la SDSE
   */
  originalIn?: number | null
  /**
   * Sorties du mois
   */
  out?: number | null
  /**
   * Sorties du mois de la SDSE
   */
  originalOut?: number | null
  /**
   * Stock recalculé
   */
  stock?: number | null
  /**
   * Stock de la SDSE
   */
  originalStock?: number | null
  /**
   * Voir les activité du contentieux (propre à une page)
   */
  showActivityGroup?: boolean
  /**
   * Voir les options du contentieux (propre à une page)
   */
  showOptionGroup?: boolean
  /**
   * Voir les temps moyens des magistrats
   */
  averageProcessingTime: number | null
  /**
   * Voir les tempos moyens des greffiers
   */
  averageProcessingTimeFonc: number | null
  /**
   * Parent en cas d'héritage
   */
  parent?: ContentieuReferentielInterface
  /**
   * Affiche ou non ses enfants (page calculateur)
   */
  childIsVisible?: boolean
  /**
   * Si un magistrat à été modifié
   */
  isModified?: boolean
  /**
   * Si un fonctionnaire à été modifié
   */
  isModifiedFonc?: boolean
  /**
   * Temps moyen par défaut magistrat
   */
  defaultValue?: any
  /**
   * Temps moyen par défaut des greffier
   */
  defaultValueFonc?: any
  /**
   * Niveau de qualité de la donnée d'entrées
   */
  valueQualityIn?: ValueQualityEnum | null;
  /**
   * Niveau de qualité de la donnée de sorties
   */
  valueQualityOut?: ValueQualityEnum | null;
  /**
   * Niveau de qualité de la donnée de stock
   */
  valueQualityStock?: ValueQualityEnum | null;
  /**
   * Url d'aide de la donnée
   */
  helpUrl?: string | null;
  /**
   * Possible gain sur le taux de complétion si complété par l'utilistateur
   */
  possibleGainCompletion? : number
  /**
   * Log de mise à jour de donnée d'activité
   */
  activityUpdated?: NodeActivityUpdatedInterface | null
}

/**
 * Interface d'un référentiel spécifique à la page
 */
export interface ContentieuReferentielActivitiesInterface
  extends ContentieuReferentielInterface {
  /**
   * Contentieux niveau 4
   */
  childrens?:
    | ContentieuReferentielActivitiesInterface[]
    | ContentieuReferentielInterface[]
  /**
   * Log de mise à jour de donnée d'activité
   */
  activityUpdated: NodeActivityUpdatedInterface | null
  /**
   * Auto focus value
   */
  autoFocusInput?: string
  /**
   * Possible gain sur le taux de complétion si complété par l'utilistateur
   */
  possibleGainCompletion? : number
}
