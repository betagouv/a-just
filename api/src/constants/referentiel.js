import { fixDecimal } from '../utils/number'

/**
 * Constante utilisé dans l'extracteur pour les cas particuliers de dialogue de gestion
 */
export const CET_LABEL = 'Compte épargne temps' //'Décharge syndicale' //'CONGÉ LONGUE MALADIE'
/**
 * Categorie utilisée dans l'extracteur pour l'absentéisme lors des dialogues de gestion
 */
export const ABSENTEISME_LABELS = ['Congé maladie ordinaire', 'Congé maternité/paternité/adoption']

/**
 * Conversion d'un nom de référentiel en index de position
 * @param {*} name
 * @returns
 */
export function referentielMappingIndex(name, rank) {
  switch (name) {
    case 'Autres activités':
      return 12
    case 'Indisponibilité':
      return 13
    case 'Siège Pénal':
      return 8
    case 'Contentieux JAF':
      return 2
    case 'Contentieux Social':
      return 1
    case 'Contentieux de la Protection':
      return 3
    case 'Juges des Enfants':
      return 7
    case 'Civil Non Spécialisé':
      return 4
    case "Juges d'Instruction":
      return 9
    case 'JLD Civil':
      return 6
    case 'JAP':
      return 10
    case 'JLD pénal':
      return 11
    case 'JLD civil':
      return 5
  }

  return rank
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
  }

  return `${fixDecimal(value * 100)}%`
}
