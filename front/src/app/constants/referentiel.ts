/**
 * Liste des réferentiels que l'on ne peut pas modifier
 */
export const REFERENTIELS_CANT_UPDATED = ['Autres activités']

/**
 * ETP need to be updated
 */
export const ETP_NEED_TO_BE_UPDATED = 0.000001

/**
 * Detais des réferentiels à afficher lors d'un hover
 */
export const getReferentielDetail = (label: string) => {
    switch (label) {
        case "Soutien (hors formations suivies)":
            return "Activités support et transverses qui contribuent au fonctionnement de la juridiction (chef de pôle/service, conduite du dialogue social, gestion des ressources humaines, budgétaire, immobilière, informatique, etc…)"
        case "Formations suivies":
            return "Les formations initiales, continues ou changement de fonction peuvent être englobées forfaitairement dans la rubrique soutien ou être distinguées ici, à votre convenance. Elles seront additionnées dans la rubrique soutien pour les dialogues de gestion"
        case "Formations dispensées":
            return "Elles doivent être distinguées des autres formations lors des déclaratifs d'ETPT des dialogues de gestion"
        case "Accès au droit et à la justice":
            return "Notamment au titre du CDAD. Cette rubrique est requise dans les déclaratifs d'ETPT des dialogues de gestion"
        case "CSM":
            return "Ces activités doivent être distinguées lors des déclaratifs d'ETPT des dialogues de gestion"
        case "Accueil du justiciable (dont SAUJ)":
            return "Cette rubrique doit être distinguée lors des déclaratifs d'ETPT des dialogues de gestion"
        case "Autres activités non juridictionnelles":
            return "Vous pouvez renseigner ici les activités non juridictionnelles qui n’entrent pas dans la catégorie du soutien au sens des dialogues de gestion et notamment les activités administratives des agents du greffe (ex. répertoire civil / actes de dépôt / nationalités…)"
        case "Fonctionnaires affectés au CPH":
            return "Activités des agents du greffe qui n’ont pas d'équivalent pour les magistrats du siège et nécessitent d'être isolées dans les déclaratifs d'ETPT des dialogues de gestion"
        case "Fonctionnaires affectés aux activités civiles et commerciales du parquet":
            return "Activités des agents du greffe, qui n’ont pas d'équivalent pour les magistrats du siège et nécessitent d'être isolées dans les déclaratifs d'ETPT des dialogues de gestion"
        case "Fonctionnaires affectés à l'exécution des peines":
            return "Activités des agents du greffe, qui n’ont pas d'équivalent pour les magistrats du siège et nécessitent d'être isolées dans les déclaratifs d'ETPT des dialogues de gestion"
        case "Autres fonctionnaires affectés au parquet":
            return "Activités des agents du greffe, qui n’ont pas d'équivalent pour les magistrats du siège et ne nécessitent pas d'être isolées dans les déclaratifs d'ETPT des dialogues de gestion (ex. TTR, BO…)"
    }
    return null
}

export const VALUE_QUALITY_OPTION = 'facultatif';
export const VALUE_QUALITY_GOOD = 'good';
export const VALUE_QUALITY_TO_COMPLETE = 'to_complete';

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
];
