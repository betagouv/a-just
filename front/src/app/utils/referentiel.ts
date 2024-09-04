import { OPACITY_20 } from "../constants/colors"
import { ETP_NEED_TO_BE_UPDATED } from "../constants/referentiel"
//import { juridictionJIRS } from "../constants/juridiction-jirs"
//import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'

/**
 * Conversion d'un nom de référentiel en version simplifiée TJ
 * @param name
 * @returns
 */
export function referentielMappingName(name: string): string {
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
 * Conversion d'un nom de référentiel en version simplifiée CA
 * @param name
 * @returns
 */
export function referentielCAMappingName(name: string): string {
  switch (name) {
    case "Contentieux social":
      return "Social";
    case "Contentieux de la famille":
      return "Famille";
    case "Contentieux de la protection":
      return "CTX JCP";
    case "Contentieux civil non spécialisé":
      return "Civil Ns";
    case "Contentieux commercial":
      return "Comm.";
    case "Attributions du PP":
      return "PP";
    case "Contentieux civil JLD":
      return "Jld Civil";
    case "Contentieux des mineurs":
      return "Mineurs";
    case "Instruction et entraide":
      return "CHINS";
    case "Correctionnel":
      return "CHAC";
    case "Contentieux criminel":
      return "Crim.";
    case "Application des peines":
      return "CHAP";
    case "Autres activités":
      return "Autres";
  }

  return name;
}

/**
 * Récupération du code couleur des référentiels TJ
 * @param name
 * @returns
 */
export function referentielMappingColor(
  name: string,
  opacity: number = 1
): string {
  if (opacity === OPACITY_20) {
    switch (name) {
      case 'Autres activités':
        return `rgb(215, 217, 219)`
      case 'Indisponibilité':
        return `rgb(55, 71, 79)`
      case 'Siège Pénal':
        return `rgb(245, 214, 213)`
      case 'Contentieux JAF':
        return `rgb(208, 226, 242)`
      case 'Contentieux Social':
        return `rgb(213, 231, 232)`
      case 'Contentieux de la Protection':
        return `rgb(208, 222, 242)`
      case 'Juges des Enfants':
        return `rgb(227, 211, 237)`
      case 'Civil Non Spécialisé':
        return `rgb(213, 216, 235)`
      case "Juges d'Instruction":
        return `rgb(250, 221, 212)`
      case 'JLD Civil':
        return `rgb(217, 211, 237)`
      case 'JAP':
        return `rgb(255, 227, 212)`
      case 'JLD pénal':
        return `rgb(255, 235, 214)`
      case 'JLD civil':
        return `rgb(217, 211, 237)`
    }
  } else {
    switch (name) {
      case 'Autres activités':
        return `rgba(66, 66, 66, ${opacity})`
      case 'Indisponibilité':
        return `rgba(55, 71, 79, ${opacity})`
      case 'Siège Pénal':
        return `rgba(199, 40, 40, ${opacity})`
      case 'Contentieux JAF':
        return `rgba(2, 120, 189, ${opacity})`
      case 'Contentieux Social':
        return `rgba(1, 131, 143, ${opacity})`
      case 'Contentieux de la Protection':
        return `rgba(21, 100, 191, ${opacity})`
      case 'Juges des Enfants':
        return `rgba(105, 28, 153, ${opacity})`
      case 'Civil Non Spécialisé':
        return `rgba(40, 53, 148, ${opacity})`
      case "Juges d'Instruction":
        return `rgba(217, 66, 20, ${opacity})`
      case 'JLD Civil':
        return `rgba(69, 39, 161, ${opacity})`
      case 'JAP':
        return `rgba(240, 108, 0, ${opacity})`
      case 'JLD pénal':
        return `rgba(255, 145, 0, ${opacity})`
      case 'JLD civil':
        return `rgba(69, 39, 161, ${opacity})`
    }
  }

  return ''
}

/**
 * Récupération du code couleur des référentiels CA NEW COLORS
 * @param name
 * @returns
 */
export function referentielCAMappingColor(
  name: string,
  opacity: number = 1
): string {
  if (opacity === OPACITY_20) {
    switch (name) {
      case "Contentieux social":
        return `rgb(213, 231, 232)`
      case "Contentieux de la famille":
        return `rgb(208, 226, 242)`
      case "Contentieux de la protection":
        return `rgb(208, 222, 242)`
      case "Contentieux civil non spécialisé":
        return `rgb(213, 216, 235)`
      case "Contentieux commercial":
        return `rgb(190, 224, 230)`
      case "Attributions du PP":
        return `rgb(255, 248, 214)`
      case "Contentieux civil JLD":
        return `rgb(217, 211, 237)`
      case "Contentieux des mineurs":
        return `rgb(227, 211, 237)`
      case "Instruction et entraide":
        return `rgb(250, 221, 212)`
      case "Correctionnel":
        return `rgb(245, 214, 213)`
      case "Contentieux criminel":
        return `rgb(255, 235, 214)`
      case "Application des peines":
        return `rgb(255, 227, 212)`
      case "Autres activités":
        return `rgb(215, 217, 219)`
    }
  } else {
    switch (name) {
      case "Contentieux social":
        return `rgba(1, 131, 143, ${opacity})`
      case "Contentieux de la famille":
        return `rgba(0, 118, 191, ${opacity})`
      case "Contentieux de la protection":
        return `rgba(21, 100, 191, ${opacity})`
      case "Contentieux civil non spécialisé":
        return `rgba(39, 52, 145, ${opacity})`
      case "Contentieux commercial":
        return `rgba(37, 190, 207, ${opacity})`
      case "Attributions du PP":
        return `rgba(250, 202, 12, ${opacity})`
      case "Contentieux civil JLD":
        return `rgba(70, 37, 161, ${opacity})`
      case "Contentieux des mineurs":
        return `rgba(104, 26, 153, ${opacity})`
      case "Instruction et entraide":
        return `rgba(214, 65, 19, ${opacity})`
      case "Correctionnel":
        return `rgba(196, 39, 39, ${opacity})`
      case "Contentieux criminel":
        return `rgba(255, 145, 0, ${opacity})`
      case "Application des peines":
        return `rgba(240, 108, 0, ${opacity})`
      case "Autres activités":
        return `rgba(100, 100, 100, ${opacity})`
    }
  }

  return ''
}

/**
 * Récupération du code couleur des référentiels TJ
 * @param name
 * @returns
 */
export function referentielMappingColorActivity(
  name: string,
  opacity: number = 1
): string {
  if (opacity === OPACITY_20) {
    switch (name) {
      case 'Autres activités':
        return `rgb(215, 217, 219)`
      case 'Indisponibilité':
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
      case "JI":
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
    }
  } else {
    switch (name) {
      case 'Autres activités':
        return `rgba(66, 66, 66, ${opacity})`
      case 'Indisponibilité':
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
      case "JI":
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
    }
  }

  return ''
}

/**
 * Récupération du code couleur des référentiels CA
 * @param name
 * @returns
 */
export function referentielMappingColorCAActivity(
  name: string,
  opacity: number = 1
): string {
  if (opacity === OPACITY_20) {
    switch (name) {
      case "Social":
        return `rgb(213, 231, 232)`
      case "Famille":
        return `rgb(208, 226, 242)`
      case "CTX JCP":
        return `rgb(208, 222, 242)`
      case "Civil Ns":
        return `rgb(213, 216, 235)`
      case "Comm.":
        return `rgb(190, 224, 230)`
      case "PP":
        return `rgb(255, 248, 214)`
      case "Jld Civil":
        return `rgb(217, 211, 237)`
      case "Mineurs":
        return `rgb(227, 211, 237)`
      case "CHINS":
        return `rgb(250, 221, 212)`
      case "CHAC":
        return `rgb(245, 214, 213)`
      case "Crim.":
        return `rgb(255, 235, 214)`
      case "CHAP":
        return `rgb(255, 227, 212)`
      case "Autres":
        return `rgb(215, 217, 219)`
    }
  } else {
    switch (name) {
      case "Social":
        return `rgba(1, 131, 143, ${opacity})`
      case "Famille":
        return `rgba(0, 118, 191, ${opacity})`
      case "CTX JCP":
        return `rgba(21, 100, 191, ${opacity})`
      case "Civil Ns":
        return `rgba(39, 52, 145, ${opacity})`
      case "Comm.":
        return `rgba(37, 190, 207, ${opacity})`
      case "PP":
        return `rgba(250, 202, 12, ${opacity})`
      case "Jld Civil":
        return `rgba(70, 37, 161, ${opacity})`
      case "Mineurs":
        return `rgba(104, 26, 153, ${opacity})`
      case "CHINS":
        return `rgba(214, 65, 19, ${opacity})`
      case "CHAC":
        return `rgba(196, 39, 39, ${opacity})`
      case "Crim.":
        return `rgba(255, 145, 0, ${opacity})`
      case "CHAP":
        return `rgba(240, 108, 0, ${opacity})`
      case "Autres":
        return `rgba(100, 100, 100, ${opacity})`
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
