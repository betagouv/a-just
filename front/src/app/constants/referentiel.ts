/**
 * Liste des réferentiels que l'on ne peut pas modifier
 */
export const REFERENTIELS_CANT_UPDATED = ['Autres activités']

/**
 * ETP need to be updated
 */
export const ETP_NEED_TO_BE_UPDATED = 0.000001

/**
 * Detais des réferentiels TJ à afficher lors d'un hover
 */
export const getReferentielDetail = (label: string) => {
  switch (label) {
    case 'Soutien (hors formations suivies)':
      return 'Activités support et transverses qui contribuent au fonctionnement de la juridiction (chef de pôle/service, conduite du dialogue social, gestion des ressources humaines, budgétaire, immobilière, informatique, etc…)'
    case 'Formations suivies':
      return 'Les formations initiales, continues ou changement de fonction peuvent être englobées forfaitairement dans la rubrique soutien ou être distinguées ici, à votre convenance. Elles seront additionnées dans la rubrique soutien pour les dialogues de gestion'
    case 'Formations dispensées':
      return "Elles doivent être distinguées des autres formations lors des déclaratifs d'ETPT des dialogues de gestion"
    case 'Accès au droit et à la justice':
      return 'Notamment au titre du CDAD, du BAJ, de l’AJ et des MJD. Cette rubrique est requise dans les déclaratifs d’ETPT des dialogues de gestion'
    case 'CSM':
      return "Ces activités doivent être distinguées lors des déclaratifs d'ETPT des dialogues de gestion"
    case 'Accueil du justiciable (dont SAUJ)':
      return "Cette rubrique doit être distinguée lors des déclaratifs d'ETPT des dialogues de gestion"
    case 'Autres activités non juridictionnelles':
      return 'Vous pouvez renseigner ici les activités non juridictionnelles qui n’entrent pas dans la catégorie du soutien au sens des dialogues de gestion et notamment les activités administratives des agents du greffe (ex. répertoire civil / actes de dépôt / nationalités…)'
    case 'Fonctionnaires affectés au CPH':
      return "Activités des agents du greffe qui n’ont pas d'équivalent pour les magistrats du siège et nécessitent d'être isolées dans les déclaratifs d'ETPT des dialogues de gestion"
    case 'Fonctionnaires affectés aux activités civiles et commerciales du parquet':
      return "Activités des agents du greffe, qui n’ont pas d'équivalent pour les magistrats du siège et nécessitent d'être isolées dans les déclaratifs d'ETPT des dialogues de gestion"
    case "Fonctionnaires affectés à l'exécution des peines":
      return "Activités des agents du greffe, qui n’ont pas d'équivalent pour les magistrats du siège et nécessitent d'être isolées dans les déclaratifs d'ETPT des dialogues de gestion"
    case 'Autres fonctionnaires affectés au parquet':
      return "Activités des agents du greffe, qui n’ont pas d'équivalent pour les magistrats du siège et ne nécessitent pas d'être isolées dans les déclaratifs d'ETPT des dialogues de gestion (ex. TTR, BO…)"
  }
  return null
}

/**
 * Detais des réferentiels CA à afficher lors d'un hover
 */
export const getReferentielCADetail = (label: string) => {
  switch (label) {
    //case"Expertises (suivi et listes)":
    //return "Si vous le souhaitez, vous avez la possibilité d'isoler ici l'ensemble des activités relatives au suivi des expertises"
    //case "Médiation (suivi et listes)":
    //return "Si vous le souhaitez, vous avez la possibilité d'isoler ici les activités relatives à la médiation"
    case 'Accès au droit et à la Justice':
      return "Cette rubrique est requise dans les déclaratifs d'ETPT des dialogues de gestion"
    case 'Accueil du justiciable': // DDG TAG
      return "Cette rubrique doit être distinguée lors des déclaratifs d'ETPT des dialogues de gestion"
    case 'Fonctionnaires / JA affectés aux activités civiles et commerciales du parquet général':
      return "Activités des agents du greffe, qui n’ont pas d'équivalent pour les magistrats du siège et nécessitent d'être isolées dans les déclaratifs d'ETPT des dialogues de gestion"
    case 'Autres fonctionnaires / JA affectés au parquet général':
      return "Activités des agents du greffe, qui n’ont pas d'équivalent pour les magistrats du siège et ne nécessitent pas d'être isolées dans les déclaratifs d'ETPT des dialogues de gestion (ex. TTR, BO…)"
    case 'Formations suivies':
      return 'Les formations initiales, continues ou changement de fonction peuvent être englobées forfaitairement dans la rubrique soutien ou être distinguées ici, à votre convenance. Elles seront additionnées dans la rubrique soutien pour les dialogues de gestion'
    case 'Formations dispensées':
      return "Elles doivent être distinguées des autres formations lors des déclaratifs d'ETPT des dialogues de gestion"
    case 'CSM':
      return "Ces activités doivent être distinguées lors des déclaratifs d'ETPT des dialogues de gestion"
    case 'Soutien (hors formations suivies)': // DDG TAG
      return 'Activités support et transverses qui contribuent au fonctionnement de la juridiction (chef de pôle/service, conduite du dialogue social, gestion des ressources humaines, budgétaire, immobilière, informatique, etc…)'
  }
  return null
}

/**
 * Liste des réferentiels devant être saisi pour les DDG
 */
export const DDG_REFERENTIELS_MAG_CA = [
  'ASSISES JIRS',
  'CONTENTIEUX JIRS',
  'CONTENTIEUX DE LA DÉTENTION JIRS',
  'CONTENTIEUX DU CONTRÔLE JUDICIAIRE JIRS',
  'CONTENTIEUX DE FOND JIRS',
  'ASSISES HORS JIRS',
  'COUR CRIMINELLE DÉPARTEMENTALE',
  'SOUTIEN (HORS FORMATIONS SUIVIES)',
]
/**
 * Liste des réferentiels devant être saisi pour les DDG
 */
export const DDG_REFERENTIELS_MAG = [
  "COUR D'ASSISES",
  "DÉPARTAGE PRUD'HOMAL",
  'CSM',
  'TUTELLES MINEURS',
  'PROTECTION DES MAJEURS',
  'INJONCTIONS DE PAYER',
  'SAISIE DES RÉMUNÉRATIONS',
  'CONTENTIEUX GÉNÉRAL <10.000€',
  'ACTIVITÉ CIVILE',
  'ACTIVITÉ PÉNALE',
  "COUR D'ASSISES HORS JIRS",
  'OP CONTRAVENTIONNELLES',
  'TRIBUNAL DE POLICE',
  'COUR CRIMINELLE',
  "COUR D'ASSISES JIRS",
  'COLLÉGIALES JIRS CRIM-ORG',
  'COLLÉGIALES JIRS ECO-FI',
  'COLLÉGIALES AUTRES SECTIONS SPÉCIALISÉES',
  'SERVICE GÉNÉRAL',
  'ECO-FI HORS JIRS',
  'JIRS ÉCO-FI',
  'JIRS CRIM-ORG',
  'AUTRES SECTIONS SPÉCIALISÉES',
  'SOUTIEN (HORS FORMATIONS SUIVIES)',
  'FORMATIONS SUIVIES',
  'FORMATIONS DISPENSÉES',
  'ACCUEIL DU JUSTICIABLE (DONT SAUJ)',
  'ACCÈS AU DROIT ET À LA JUSTICE',
]

export const DDG_REFERENTIELS_GREFFE = [
  "DÉPARTAGE PRUD'HOMAL",
  'TUTELLES MINEURS',
  'PROTECTION DES MAJEURS',
  'INJONCTIONS DE PAYER',
  'SAISIE DES RÉMUNÉRATIONS',
  'CONTENTIEUX GÉNÉRAL <10.000€',
  'ACTIVITÉ CIVILE',
  'ACTIVITÉ PÉNALE',
  "COUR D'ASSISES HORS JIRS",
  'OP CONTRAVENTIONNELLES',
  'TRIBUNAL DE POLICE',
  'COUR CRIMINELLE',
  "COUR D'ASSISES JIRS",
  'COLLÉGIALES JIRS CRIM-ORG',
  'COLLÉGIALES JIRS ECO-FI',
  'COLLÉGIALES AUTRES SECTIONS SPÉCIALISÉES',
  'SERVICE GÉNÉRAL',
  'ECO-FI HORS JIRS',
  'JIRS ÉCO-FI',
  'JIRS CRIM-ORG',
  'AUTRES SECTIONS SPÉCIALISÉES',
  'SOUTIEN (HORS FORMATIONS SUIVIES)',
  'FORMATIONS SUIVIES',
  'FORMATIONS DISPENSÉES',
  'ACCUEIL DU JUSTICIABLE (DONT SAUJ)',
  'ACCÈS AU DROIT ET À LA JUSTICE',
  'FONCTIONNAIRES AFFECTÉS AU CPH',
  'FONCTIONNAIRES AFFECTÉS AUX ACTIVITÉS CIVILES ET COMMERCIALES DU PARQUET',
  "FONCTIONNAIRES AFFECTÉS À L'EXÉCUTION DES PEINES",
  'AUTRES FONCTIONNAIRES AFFECTÉS AU PARQUET',
  'FONCTIONNAIRES / JA AFFECTÉS AUX ACTIVITÉS CIVILES ET COMMERCIALES DU PARQUET GÉNÉRAL',
  'AUTRES FONCTIONNAIRES / JA AFFECTÉS AU PARQUET GÉNÉRAL',
]

export const DDG_REFERENTIELS_GREFFE_CA = [
  'ASSISES JIRS',
  'CONTENTIEUX JIRS',
  'CONTENTIEUX DE LA DÉTENTION JIRS',
  'CONTENTIEUX DU CONTRÔLE JUDICIAIRE JIRS',
  'CONTENTIEUX DE FOND JIRS',
  'ASSISES HORS JIRS',
  'COUR CRIMINELLE DÉPARTEMENTALE',
  'SOUTIEN (HORS FORMATIONS SUIVIES)',
]

export const DDG_REFERENTIELS_EAM = [
  "COUR D'ASSISES JIRS",
  'COLLÉGIALES JIRS CRIM-ORG',
  'COLLÉGIALES JIRS ECO-FI',
  'JIRS ÉCO-FI',
  'JIRS CRIM-ORG',
]

export const DDG_REFERENTIELS_EAM_CA = [
  'SOUTIEN (HORS FORMATIONS SUIVIES)',
  'FORMATIONS SUIVIES',
  'FORMATIONS DISPENSÉES',
  'ACCÈS AU DROIT ET À LA JUSTICE',
  'ASSISES JIRS',
  'CONTENTIEUX JIRS',
  'CONTENTIEUX DE LA DÉTENTION JIRS',
  'CONTENTIEUX DU CONTRÔLE JUDICIAIRE JIRS',
  'CONTENTIEUX DE FOND JIRS',
  'ASSISES HORS JIRS',
  'COUR CRIMINELLE DÉPARTEMENTALE',
  'SOUTIEN (HORS FORMATIONS SUIVIES)',
  'FONCTIONNAIRES / JA AFFECTÉS AUX ACTIVITÉS CIVILES ET COMMERCIALES DU PARQUET GÉNÉRAL',
  'ACCUEIL DU JUSTICIABLE',
  'AUTRES FONCTIONNAIRES / JA AFFECTÉS AU PARQUET GÉNÉRAL',
]
export const VALUE_QUALITY_OPTION = 'facultatif'
export const VALUE_QUALITY_GOOD = 'good'
export const VALUE_QUALITY_TO_COMPLETE = 'to_complete'
export const VALUE_QUALITY_TO_VERIFY = 'to_verify'

export const QUALITY_LIST = [
  {
    label: 'Facultative',
    key: VALUE_QUALITY_OPTION,
  },
  {
    label: 'Bonne',
    key: VALUE_QUALITY_GOOD,
  },
  {
    label: 'À compléter',
    key: VALUE_QUALITY_TO_COMPLETE,
  },
  {
    label: 'À vérifier',
    key: VALUE_QUALITY_TO_VERIFY,
  },
]
