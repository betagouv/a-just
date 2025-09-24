import { OPACITY_20 } from '../constants/colors'
import { ETP_NEED_TO_BE_UPDATED } from '../constants/referentiel'

/**
 * Conversion d'un nom de référentiel en version simplifiée TJ
 * @param name
 * @returns
 */
export function referentielMappingName(name: string): string {
  switch (name) {
    case 'Autres activités':
      return 'Autres'
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
 * Conversion d'un nom de référentiel en version simplifiée CA
 * @param name
 * @returns
 */
export function referentielCAMappingName(name: string): string {
  switch (name) {
    case 'Contentieux social':
      return 'Social'
    case 'Contentieux de la famille':
      return 'Famille'
    case 'Contentieux de la protection':
      return 'JCP'
    case 'Contentieux civil non spécialisé':
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
      return 'Autres'
    case 'Contentieux locaux spécifiques':
      return 'CTX SPÉ.'
  }

  return name
}

/**
 * Récupération du code couleur des référentiels TJ
 * @param name
 * @returns
 */
export function referentielMappingColor(name: string, opacity: number = 1): string {
  if (opacity === OPACITY_20) {
    switch (name) {
      case 'Autres':
        return `rgb(215, 217, 219)`
      case 'Indisp.':
        return `rgb(55, 71, 79)`
      case 'Pénal':
        return `rgb(245, 214, 213)`
      case 'JAF':
        return `rgb(208, 226, 242)`
      case 'Social':
        return `rgb(213, 231, 232)`
      case 'JCP':
        return `rgb(208, 222, 242)`
      case 'JE':
        return `rgb(227, 211, 237)`
      case 'Civil NS':
        return `rgb(213, 216, 235)`
      case 'JI':
        return `rgb(250, 221, 212)`
      case 'JLD Civil':
        return `rgb(217, 211, 237)`
      case 'JAP':
        return `rgb(255, 227, 212)`
      case 'JLD pénal':
        return `rgb(255, 235, 214)`
      case 'JLD civil':
        return `rgb(217, 211, 237)`
      case 'Contentieux locaux spécifiques':
      case 'CTX SPÉ.':
        return `rgb(255, 248, 213)`
    }
  } else {
    switch (name) {
      case 'Autres':
        return `rgba(66, 66, 66, ${opacity})`
      case 'Indisp.':
        return `rgba(55, 71, 79, ${opacity})`
      case 'Pénal':
        return `rgba(199, 40, 40, ${opacity})`
      case 'JAF':
        return `rgba(2, 120, 189, ${opacity})`
      case 'Social':
        return `rgba(1, 131, 143, ${opacity})`
      case 'JCP':
        return `rgba(21, 100, 191, ${opacity})`
      case 'JE':
        return `rgba(105, 28, 153, ${opacity})`
      case 'Civil NS':
        return `rgba(40, 53, 148, ${opacity})`
      case 'JI':
        return `rgba(217, 66, 20, ${opacity})`
      case 'JLD Civil':
        return `rgba(69, 39, 161, ${opacity})`
      case 'JAP':
        return `rgba(240, 108, 0, ${opacity})`
      case 'JLD pénal':
        return `rgba(255, 145, 0, ${opacity})`
      case 'JLD civil':
        return `rgba(69, 39, 161, ${opacity})`
      case 'Contentieux locaux spécifiques':
      case 'CTX SPÉ.':
        return `rgba(251, 202, 12, ${opacity})`
    }
  }

  return ''
}

/**
 * Récupération du code couleur des référentiels TJ
 * @param name
 * @returns
 */
export function referentielMappingColorActivity(name: string, opacity: number = 1): string {
  if (opacity === OPACITY_20) {
    switch (name) {
      case 'Autres':
        return `rgb(215, 217, 219)`
      case 'Indisp.':
        return `rgb(55, 71, 79)`
      case 'Pénal':
        return `rgb(245, 214, 213)`
      case 'JAF':
        return `rgb(208, 226, 242)`
      case 'Social':
        return `rgb(213, 231, 232)`
      case 'JCP':
        return `rgb(208, 222, 242)`
      case 'JE':
        return `rgb(227, 211, 237)`
      case 'Civil NS':
        return `rgb(213, 216, 235)`
      case 'JI':
        return `rgb(250, 221, 212)`
      case 'JLD Civil':
        return `rgb(217, 211, 237)`
      case 'JAP':
        return `rgb(255, 227, 212)`
      case 'JLD pénal':
        return `rgb(255, 235, 214)`
      case 'JLD civil':
        return `rgb(217, 211, 237)`
      case 'other':
        return '#d8dadc'
      case 'Contentieux locaux spécifiques':
      case 'CTX SPÉ.':
        return `rgb(255, 248, 213)`
    }
  } else {
    switch (name) {
      case 'Autres':
        return `rgba(66, 66, 66, ${opacity})`
      case 'Indisp.':
        return `rgba(55, 71, 79, ${opacity})`
      case 'Pénal':
        return `rgba(199, 40, 40, ${opacity})`
      case 'JAF':
        return `rgba(2, 120, 189, ${opacity})`
      case 'Social':
        return `rgba(1, 131, 143, ${opacity})`
      case 'JCP':
        return `rgba(21, 100, 191, ${opacity})`
      case 'JE':
        return `rgba(105, 28, 153, ${opacity})`
      case 'Civil NS':
        return `rgba(40, 53, 148, ${opacity})`
      case 'JI':
        return `rgba(217, 66, 20, ${opacity})`
      case 'JLD Civil':
        return `rgba(69, 39, 161, ${opacity})`
      case 'JAP':
        return `rgba(240, 108, 0, ${opacity})`
      case 'JLD pénal':
        return `rgba(255, 145, 0, ${opacity})`
      case 'JLD civil':
        return `rgba(69, 39, 161, ${opacity})`
      case 'other':
        return '#d8dadc'
      case 'Contentieux locaux spécifiques':
      case 'CTX SPÉ.':
        return `rgba(251, 202, 12, ${opacity})`
    }
  }

  return ''
}

/**
 * Récupération du code couleur des référentiels CA
 * @param name
 * @returns
 */
export function referentielMappingColorCAActivity(name: string, opacity: number = 1): string {
  const tmp = referentielCAMappingName(name)

  if (opacity === OPACITY_20) {
    switch (tmp) {
      case 'Social':
        return `rgb(212, 231, 232)`
      case 'Famille':
        return `rgba(210, 227, 243, 1)`
      case 'JCP':
        return `rgba(198, 219, 242, 1)`
      case 'Civil NS':
        return `rgba(208, 213, 248, 1)`
      case 'Comm.':
        return `rgba(222, 237, 239, 1)`
      case 'PP':
        return `rgb(218, 212, 237)`
      case 'Mineurs':
        return `rgb(228, 211, 237)`
      case 'CHINS': //CHINS
        return `rgb(249, 219, 211)`
      case 'CHAC':
        return `rgb(245, 214, 213)`
      case 'Crim.':
        return `rgb(255, 234, 213)`
      case 'CHAP':
        return `rgb(253, 226, 211)`
      case 'Autres':
        return `rgb(216, 218, 220)`
    }
  } else {
    switch (tmp) {
      case 'Social':
        return `rgba(3, 131, 143, ${opacity})`
      case 'Famille':
        return `rgba(4, 134, 213, ${opacity})`
      case 'JCP':
        return `rgba(5, 89, 189, ${opacity})`
      case 'Civil NS':
        return `rgba(40, 53, 146, ${opacity})`
      case 'Comm.':
        return `rgba(3, 167, 184, ${opacity})`
      case 'PP':
        return `rgba(69, 38, 160, ${opacity})`
      case 'Mineurs':
        return `rgba(105, 26, 154, ${opacity})`
      case 'CHINS': //CHINS
        return `rgba(215, 66, 21, ${opacity})`
      case 'CHAC':
        return `rgba(197, 41, 40, ${opacity})`
      case 'Crim.':
        return `rgba(255, 143, 0, ${opacity})`
      case 'CHAP':
        return `rgba(239, 108, 0, ${opacity})`
      case 'Autres':
        return `rgba(66, 66, 66, ${opacity})`
    }
  }

  return ''
}

/**
 * Conversion d'un ETP en string humain
 * @param value
 * @returns
 */
export function etpLabel(value: number): string | null {
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

  return `${Math.floor(value * 100)}%`
}
