/**
 * Structure complète des contentieux niveau 2 et leurs sous-contentieux niveau 3
 * Utilisée pour les tests e2e de vérification de l'affichage des contentieux
 */
export const contentieuxStructure = [
  {
    level2: "Social",
    level3: [
      "Départage prud'homal",
      "Contentieux de la protection sociale",
      "Référés",
      "Autres contentieux sociaux",
    ],
  },
  {
    level2: "JAF",
    level3: [
      "Mariages et régimes matrimoniaux",
      "Divorce - contentieux",
      "Après divorce",
      "Liquidations partages",
      "Autorité parentale",
      "Obligations à caractère alimentaire",
      "Tutelles mineurs",
      "Référés et mesures urgentes",
      "Autres JAF",
    ],
  },
  {
    level2: "JCP",
    level3: [
      "Protection des majeurs",
      "Surendettement des particuliers",
      "Baux",
      "Crédit à la consommation",
      "Injonctions de payer",
      "Saisie des rémunérations",
      "Référés",
      "Autres contentieux de la protection",
    ],
  },
  {
    level2: "Civil NS",
    level3: [
      "Contentieux général <10.000€",
      "Droit des personnes",
      "Droit de la famille",
      "Contrats",
      "Responsabilité et quasi-contrats",
      "Droit des biens",
      "Construction",
      "Exécution",
      "Droit des affaires",
      "Procédures collectives civiles",
      "Propriété industrielle",
      "Propriété littéraire et artistique",
      "Suivi des expertises",
      "Affaires gracieuses",
      "Juridiction du président",
      "Intérêts civils",
      "CIVI",
      "Référés civils",
      "Autres civil NS",
    ],
  },
  {
    level2: "JLD civil",
    level3: ["Rétention des étrangers", "HO - Contention", "Autres JLD civil"],
  },
  {
    level2: "JE",
    level3: ["Activité civile", "Activité pénale"],
  },
  {
    level2: "Pénal",
    level3: [
      "Collégiales",
      "CI",
      "Juge unique",
      "CRPC",
      "CPPV",
      "Compositions pénales",
      "OP correctionnelles",
      "Cour d'assises",
      "Cour criminelle",
      "Tribunal de police",
      "OP contraventionnelles",
      "Collégiales éco-fi",
      "Collégiales autres sections spécialisées",
      "Autres siège pénal",
    ],
  },
  {
    level2: "JI",
    level3: ["Service général", "Eco-fi", "Autres sections spécialisées"],
  },
  {
    level2: "JAP",
    level3: [
      "Milieu ouvert",
      "Milieu fermé",
      "Ordonnances hors CAP",
      "Autres JAP",
    ],
  },
  {
    level2: "JLD pénal",
    level3: ["Hors JIRS"],
  },
];

/**
 * Récupère tous les contentieux niveau 2 uniquement
 * @returns {string[]} Liste des libellés des contentieux niveau 2
 */
export const getLevel2Contentieux = () => {
  return contentieuxStructure.map((item) => item.level2);
};

/**
 * Récupère tous les contentieux niveau 3 uniquement
 * @returns {string[]} Liste des libellés des contentieux niveau 3
 */
export const getLevel3Contentieux = () => {
  return contentieuxStructure.flatMap((item) => item.level3);
};

/**
 * Récupère les contentieux niveau 3 pour un contentieux niveau 2 donné
 * @param {string} level2Label - Le libellé du contentieux niveau 2
 * @returns {string[]} Liste des contentieux niveau 3 associés
 */
export const getLevel3ForLevel2 = (level2Label) => {
  const contentieux = contentieuxStructure.find(
    (item) => item.level2 === level2Label
  );
  return contentieux ? contentieux.level3 : [];
};

/**
 * Compte le nombre total de contentieux
 * @returns {object} Objet avec le décompte par niveau
 */
export const getContentieuxCount = () => {
  return {
    level2: contentieuxStructure.length,
    level3: contentieuxStructure.reduce(
      (total, item) => total + item.level3.length,
      0
    ),
    total:
      contentieuxStructure.length +
      contentieuxStructure.reduce(
        (total, item) => total + item.level3.length,
        0
      ),
  };
};
