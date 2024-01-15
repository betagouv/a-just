import { ETP_NEED_TO_BE_UPDATED } from "../constants/referentiel"
import { juridictionJIRS } from "../constants/juridiction-jirs"
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'

/**
 * Conversion d'un nom de référentiel en version simplifiée
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
 * Récupération du code couleur des référentiels
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

export function filterReferentiels (list: ContentieuReferentielInterface[], backupLabel: string) : void {

  list.map((ref) => {
    if (ref.childrens && juridictionJIRS.indexOf(backupLabel) == -1) {
      ref.childrens?.map((elem) => {
        switch(elem.label) {
          case 'Collégiales hors JIRS':
            elem.label = "Collégiales"
            break;
          case "Cour d'assises hors JIRS":
            elem.label = "Cour d'assises"
            break;
          case "Cour d'assises JIRS":
            ref.childrens = ref.childrens?.filter(elem => elem.label !== "Cour d'assises JIRS")
            break;
          case "Collégiales JIRS crim-org":
            ref.childrens = ref.childrens?.filter(elem => elem.label !== "Collégiales JIRS crim-org")
            break;
          case "Collégiales JIRS eco-fi":
            elem.label = "Collégiales eco-fi"
            break;
          case "Eco-fi hors JIRS":
            elem.label = "Eco-fi"
            break;
          case "JIRS éco-fi":
            ref.childrens = ref.childrens?.filter(elem => elem.label !== "JIRS éco-fi")
            break;
          case "JIRS crim-org":
            ref.childrens = ref.childrens?.filter(elem => elem.label !== "JIRS crim-org")
            break;
          case "JIRS":
            ref.childrens = ref.childrens?.filter(elem => elem.label !== "JIRS")
            break
        }
      })
    }
  })
  return;
}


export function filterReferentielCalculator (list: any, backupLabel: string) : void {
  list.map((ref: any) => {
    if (ref.childrens && juridictionJIRS.indexOf(backupLabel) == -1) {
      ref.childrens?.map((elem :any) => {
        switch(elem.contentieux.label) {
          case 'Collégiales hors JIRS':
            elem.contentieux.label = "Collégiales"
            break;
          case "Cour d'assises hors JIRS":
            elem.contentieux.label = "Cour d'assises"
            break;
          case "Cour d'assises JIRS":
            ref.childrens = ref.childrens.filter((elem: any) => elem.contentieux.label !== "Cour d'assises JIRS")
            break;
          case "Collégiales JIRS crim-org":
            ref.childrens = ref.childrens.filter((elem : any) => elem.contentieux.label !== "Collégiales JIRS crim-org")
            break;
          case "Collégiales JIRS eco-fi":
            elem.contentieux.label = "Collégiales eco-fi"
            break;
          case "Eco-fi hors JIRS":
            elem.contentieux.label = "Eco-fi"
            break;
          case "JIRS éco-fi":
            ref.childrens = ref.childrens.filter((elem : any) => elem.contentieux.label !== "JIRS éco-fi")
            break;
          case "JIRS crim-org":
            ref.childrens = ref.childrens.filter((elem : any) => elem.contentieux.label !== "JIRS crim-org")
            break;
          case "JIRS":
            ref.childrens = ref.childrens.filter((elem : any) => elem.contentieux.label !== "JIRS")
            break
        }
      })
    }
  })
  return;
}


export function filterReferentielActivityExtractor (list: any, backupLabel: string) : void {
  if (juridictionJIRS.indexOf(backupLabel) == -1) {
    list.map((ref: any) => {
      switch(ref.contentieux.label) {
        case 'Collégiales hors JIRS':
          ref.contentieux.label = "Collégiales"
          break;
        case "Cour d'assises hors JIRS":
          ref.contentieux.label = "Cour d'assises"
          break;
        case "Cour d'assises JIRS":
          list = list.filter((ref: any) => ref.contentieux.label !== "Cour d'assises JIRS")
          break;
        case "Collégiales JIRS crim-org":
          list = list.filter((ref : any) => ref.contentieux.label !== "Collégiales JIRS crim-org")
          break;
        case "Collégiales JIRS eco-fi":
          ref.contentieux.label = "Collégiales eco-fi"
          break;
        case "Eco-fi hors JIRS":
          ref.contentieux.label = "Eco-fi"
          break;
        case "JIRS éco-fi":
          list = list.filter((ref : any) => ref.contentieux.label !== "JIRS éco-fi")
          break;
        case "JIRS crim-org":
          list = list.filter((ref : any) => ref.contentieux.label !== "JIRS crim-org")
          break;
        case "JIRS":
          list = list.filter((ref : any) => ref.contentieux.label !== "JIRS")
          break
      }
    }
  )}

  return list;
}