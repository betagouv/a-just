import { fixDecimal } from '../utils/number'

/**
 * Constante utilisé dans l'extracteur pour les cas particuliers de dialogue de gestion
 */
export const CET_LABEL = 'Compte épargne temps' //'Décharge syndicale' //'CONGÉ LONGUE MALADIE'
/**
 * Categorie utilisée dans l'extracteur pour l'absentéisme lors des dialogues de gestion
 */
export const ABSENTEISME_LABELS = ['Congé maladie ordinaire', 'Congé maternité/paternité/adoption', 'Autre absentéisme']
/**
 * Constante utilisée pour l'extracteur indiquant le libelé du niveau 3 indispo
 */
export const INDISPO_L3 = 'Indisponibilité'
/**
 * Categorie utilisée dans l'extracteur qui ne comptabilise ni de l'action 99 ni de l'absentéisme
 */
export const DELEGATION_TJ = 'Délégation TJ'

/**
 * Conversion d'un nom de référentiel en index de position
 * @param {*} name
 * @returns
 */
export function referentielCAMappingIndex(name, rank) {
  switch (name) {
    case 'Contentieux Social':
      return 1
    case 'Contentieux commercial':
      return 2
    case 'Contentieux de la famille':
      return 3
    case 'Contentieux de la protection':
      return 4
    case 'Contentieux civil non spécialisé':
      return 5
    case 'Attributions du PP':
      return 6
    case 'Contentieux des mineurs':
      return 7
    case 'Correctionnel':
      return 8
    case 'Instruction et entraide':
      return 9
    case 'Application des peines':
      return 10
    case 'Contentieux criminel':
      return 11
    case 'Contentieux locaux spécifiques':
    case 'CTX SPÉ.':
      return 12
    case 'Contentieux civil JLD': // à supprimer
      return 12
    case 'Autres activités':
      return 13
    case 'Indisponibilité':
      return 14
  }

  return rank
}

/**
 * Conversion d'un nom de référentiel en index de position
 * @param {*} name
 * @returns
 */
export function referentielMappingIndex(name, rank) {
  switch (name) {
    case 'Contentieux Social':
      return 1
    case 'Contentieux JAF':
      return 2
    case 'Contentieux de la Protection':
      return 3
    case 'Civil Non Spécialisé':
      return 4
    case 'JLD civil':
      return 5
    case 'Juges des Enfants':
      return 7
    case 'Siège Pénal':
      return 8
    case "Juges d'Instruction":
      return 9
    case 'JAP':
      return 10
    case 'JLD pénal':
      return 11
    case 'Contentieux locaux spécifiques':
    case 'CTX SPÉ.':
      return 12
    case 'Autres activités':
      return 13
    case 'Indisponibilité':
      return 14
  }

  return rank
}
export function referentielCAMappingName(name) {
  switch (name) {
    case 'Contentieux Social':
      return 'Social'
    case 'Contentieux de la famille':
      return 'Famille'
    case 'Contentieux de la protection':
      return 'JCP'
    case 'Contentieux civil':
      return 'Civil NS'
    case 'Contentieux commercial':
      return 'Comm.'
    case 'Attributions du PP':
      return 'PP'
    case 'Contentieux des mineurs':
      return 'Mineurs'
    case 'Instruction et entraide':
      return 'CHINS'
    case 'Correctionnel':
      return 'CHAC'
    case 'Contentieux criminel':
      return 'Crim.'
    case 'Application des peines':
      return 'CHAP'
    case 'Autres activités':
      return 'Autres activités'
    case 'Contentieux locaux spécifiques':
      return 'CTX SPÉ.'
  }

  return name
}

/**
 * Conversion d'un nom de référentiel en raccourise
 * @param {*} name
 * @returns
 */
export function referentielMappingName(name) {
  switch (name) {
    case 'Autres activités':
      return 'Autres activités'
    case 'Indisponibilité':
      return 'Indisp.'
    case 'Siège Pénal':
      return 'Pénal'
    case 'Contentieux JAF':
      return 'JAF'
    case 'Contentieux Social':
      return 'Social'
    case 'Contentieux de la Protection':
      return 'JCP'
    case 'Juges des Enfants':
      return 'JE'
    case 'Civil Non Spécialisé':
      return 'Civil NS'
    case "Juges d'Instruction":
      return 'JI'
    case 'Contentieux locaux spécifiques':
      return 'CTX SPÉ.'
  }

  return name
}

/**
 * Conversion d'un nom de référentiel en code couleur
 * @param {*} name
 * @returns
 */
export function referentielMappingColor(name) {
  switch (name) {
    case 'Autres activités':
      return '#424242'
    case 'Indisponibilité':
      return '#37474f'
    case 'Siège Pénal':
      return '#c62828'
    case 'Contentieux JAF':
      return '#0277bd'
    case 'Contentieux Social':
      return '#00838f'
    case 'Contentieux de la Protection':
      return '#1565c0'
    case 'Juges des Enfants':
      return '#6a1b9a'
    case 'Civil Non Spécialisé':
      return '#283593'
    case "Juges d'Instruction":
      return '#d84315'
    case 'JLD Civil':
      return '#4527a0'
    case 'JAP':
      return '#ef6c00'
    case 'JLD pénal':
      return '#ff8f00'
    case 'JLD civil':
      return '#4527a0'
    case 'Contentieux locaux spécifiques':
      return '#4526A0'
  }
  return ''
}

/**
 * Conversion d'un nom de référentiel en code couleur
 * @param {*} name
 * @returns
 */
export function referentielCAMappingColor(name) {
  switch (name) {
    case 'Contentieux Social':
      return '#03838f'
    case 'Contentieux commercial':
      return '#26bece'
    case 'Contentieux de la famille':
      return '#0176be'
    case 'Contentieux de la protection':
      return '#1664c0'
    case 'Contentieux civil non spécialisé':
      return '#283592'
    case 'PP':
      return '#4526a0'
    case 'Contentieux des mineurs':
      return '#691a9a'
    case 'Correctionnel':
      return '#c52928'
    case 'Instruction et entraide': //CHINS
      return '#d74215'
    case 'Application des peines':
      return '#ef6c00'
    case 'Contentieux criminel':
      return '#ef6c00'
    case 'Autres activités':
      return '#424242'
    case 'Contentieux locaux spécifiques':
      return '#DAD4ED'
    // couleur contentieux SPE à venir : '#fbca0c'
  }

  return ''
}

/**
 * Conversion d'un ETP en string
 * @param {*} value
 * @returns
 */
export function etpLabel(value) {
  switch (value) {
    case 1:
      return 'Temps plein'
    case 0.8:
      return '4/5'
    case 0.5:
      return 'Mi-temps'
    case 0:
      return 'Ne travaille pas'
    case ETP_NEED_TO_BE_UPDATED:
      return null
  }

  return `${fixDecimal(value * 100)}%`
}

/**
 * ETP need to be updated
 */
export const ETP_NEED_TO_BE_UPDATED = 0.000001
