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
      return "Protection";
    case "Contentieux civil":
      return "Civil Ns";
    case "Contentieux de la protection":
      return "Civil Ns";
    case "Contentieux commercial":
      return "Commercial";
    case "Attributions du PP":
      return "PP";
    case "Contentieux civil JLD":
      return "Jld Civil";
    case "Contentieux des mineurs":
      return "Mineurs";
    case "Instruction et entraide":
      return "Instruction / Entraide";
    case "Correctionnel":
      return "Correctionnel";
    case "Contentieux criminel":
      return "Crim.";
    case "Application des peines":
      return "Application des peines";
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
  switch (name) {
    case 'Autres activités':
      return `rgba(66, 66, 66, ${opacity})`
    case 'Indisponibilité':
      return `rgba(55, 71, 79, ${opacity})`
    case 'Siège Pénal':
      return `rgba(198, 40, 40, ${opacity})`
    case 'Contentieux JAF':
      return `rgba(2, 119, 189, ${opacity})`
    case 'Contentieux Social':
      return `rgba(0, 131, 143, ${opacity}`
    case 'Contentieux de la Protection':
      return `rgba(21, 101, 192, ${opacity})`
    case 'Juges des Enfants':
      return `rgba(106, 27, 154, ${opacity})`
    case 'Civil Non Spécialisé':
      return `rgba(40, 53, 147, ${opacity})`
    case "Juges d'Instruction":
      return `rgba(216, 67, 21, ${opacity})`
    case 'JLD Civil':
      return `rgba(69, 39, 160, ${opacity})`
    case 'JAP':
      return `rgba(239, 108, 0, ${opacity})`
    case 'JLD pénal':
      return `rgba(255, 143, 0, ${opacity})`
    case 'JLD civil':
      return `rgba(69, 39, 160, ${opacity})`
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
  switch (name) {
    case "Contentieux social":
      return `rgba(3, 131, 143,${opacity})`
    case "Contentieux de la famille":
      return `rgba(1, 118, 190, ${opacity})`
    case "Contentieux de la protection":
      return `rgba(22, 100, 192, ${opacity})`
    case "Contentieux civil":
      return `rgba(40, 53, 146, ${opacity})`
    case "Contentieux de la protection":
      return `rgba(22, 100, 192,${opacity}`
    case "Contentieux commercial":
      return `rgba(38, 190, 206, ${opacity})`
    case "Attributions du PP":
      return `rgba(251, 202, 12, ${opacity})`
    case "Contentieux civil JLD":
      return `rgba(69, 38, 160, ${opacity})`
    case "Contentieux des mineurs":
      return `rgba(105, 26, 154, ${opacity})`
    case "Instruction et entraide": //CHINS
      return `rgba(215, 66, 21, ${opacity})`
    case "Contentieux criminel":
      return `rgba(255, 143, 0,${opacity})`
    case "Application des peines": //CHAP
      return `rgba(239, 108, 0, ${opacity})`
    case "Correctionnel": //CHAC
      return `rgba(197, 41, 40, ${opacity})`
    case "Autres activités":
      return `rgba(66, 66, 66, ${opacity})`
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
  switch (name) {
    case 'Autres activités':
      return `rgba(66, 66, 66, ${opacity})`
    case 'Indisponibilité':
      return `rgba(55, 71, 79, ${opacity})`
    case 'Pénal':
      return `rgba(245, 214, 213, ${opacity})`
    case 'JAF':
      return `rgba(210, 227, 243, ${opacity})`
    case 'Social':
      return `rgba(212, 230, 232, ${opacity})`
    case 'JCP':
      return `rgba(210, 224, 243, ${opacity})`
    case 'JE':
      return `rgba(225, 210, 236, ${opacity})`
    case 'Civil NS':
      return `rgba(213, 216, 233, ${opacity})`
    case "JI":
      return `rgba(249, 219, 210, ${opacity})`
    case 'JLD Civil':
      return `rgba(218, 212, 237, ${opacity})`
    case 'JAP':
      return `rgba(253, 226, 211, ${opacity})`
    case 'JLD pénal':
      return `rgba(254, 234, 212, ${opacity})`
    case 'JLD civil':
      return `rgba(218, 212, 237, ${opacity})`
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
  switch (name) {
    case "Contentieux social":
      return `rgba(66, 66, 66, ${opacity})`
    case "Contentieux de la famille":
      return `rgba(55, 71, 79, ${opacity})`
    case "Contentieux de la protection":
      return `rgba(198, 40, 40, ${opacity})`
    case "Contentieux civil":
      return `rgba(2, 119, 189, ${opacity})`
    case "Contentieux de la protection":
      return `rgba(0, 131, 143, ${opacity}`
    case "Contentieux commercial":
      return `rgba(21, 101, 192, ${opacity})`
    case "Attributions du PP":
      return `rgba(106, 27, 154, ${opacity})`
    case "Contentieux civil JLD":
      return `rgba(40, 53, 147, ${opacity})`
    case "Contentieux des mineurs":
      return `rgba(216, 67, 21, ${opacity})`
    case "Instruction et entraide":
      return `rgba(69, 39, 160, ${opacity})`
    case "Correctionnel":
      return `rgba(239, 108, 0, ${opacity})`
    case "Contentieux criminel":
      return `rgba(255, 143, 0, ${opacity})`
    case "Application des peines":
      return `rgba(69, 39, 160, ${opacity})`
    case "Autres activités":
      return `rgba(100, 100, 100, ${opacity})`
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
