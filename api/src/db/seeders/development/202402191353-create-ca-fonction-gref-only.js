import config from 'config';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const CAFonctions = [
      {
        "FONCTION": "COND-VEH",
        "FONCTION_NL": "Conduite de véhicules"
      },
      {
        "FONCTION": "C CAB PG",
        "FONCTION_NL": "Chef de cabinet du procureur général"
      },
      {
        "FONCTION": "DG",
        "FONCTION_NL": "Directeur de greffe"
      },
      {
        "FONCTION": "ZDS",
        "FONCTION_NL": "Chargé de mission ZDS"
      },
      {
        "FONCTION": "CS QUEST",
        "FONCTION_NL": "Chef de service de la questure"
      },
      {
        "FONCTION": "DG-A",
        "FONCTION_NL": "Directeur de greffe adjoint"
      },
      {
        "FONCTION": "CS",
        "FONCTION_NL": "Chef de service"
      },
      {
        "FONCTION": "CM PP",
        "FONCTION_NL": "Chargé de mission au cabinet du premier président"
      },
      {
        "FONCTION_NL": "A",
        "FONCTION": "A"
      },
      {
        "FONCTION_NL": "CHEF DE CABINET",
        "FONCTION": "CHCAB"
      },
      {
        "FONCTION_NL": "B GREFFIER",
        "FONCTION": "B"
      },
      {
        "FONCTION_NL": "SA",
        "FONCTION": "SA"
      },
      {
        "FONCTION_NL": "CB",
        "FONCTION": "CB"
      },
      {
        "FONCTION_NL": "CT",
        "FONCTION": "CT"
      },
      {
        "FONCTION_NL": "A PLACÉ",
        "FONCTION": "A PLACÉ"
      },
      {
        "FONCTION_NL": "B GREFFIER PLACÉ",
        "FONCTION": "B GREF  PLACÉ"
      },
      {
        "FONCTION_NL": "B PLACÉ",
        "FONCTION": "B PLACÉ"
      },
      {
        "FONCTION_NL": "CB PLACÉ",
        "FONCTION": "CB PLACÉ"
      },
      {
        "FONCTION_NL": "CT PLACÉ",
        "FONCTION": "CT PLACÉ"
      },
      {
        "FONCTION_NL": "GREFFIER RESERVISTE",
        "FONCTION": "GRES"
      },
      {
        "FONCTION_NL": "CONTRACTUEL A",
        "FONCTION": "CONT A"
      },
      {
        "FONCTION_NL": "CONTRACTUEL B",
        "FONCTION": "CONT B"
      },
      {
        "FONCTION_NL": "CONTRACTUEL C",
        "FONCTION": "CONT C"
      },
      {
        "FONCTION_NL": "CONTRACTUEL CB",
        "FONCTION": "CONT CB"
      },
      {
        "FONCTION_NL": "CONTRACTUEL CT",
        "FONCTION": "CONT CT"
      },
      {
        "FONCTION_NL": "VACATAIRE",
        "FONCTION": "VAC"
      },
      {
        "FONCTION_NL": "CONTRACTUEL A JUSTICE DE PROXIMITE",
        "FONCTION": "CONT A JP"
      },
      {
        "FONCTION_NL": "CONTRACTUEL B JUSTICE DE PROXIMITE",
        "FONCTION": "CONT B JP"
      },
      {
        "FONCTION_NL": "CONTRACTUEL C JUSTICE DE PROXIMITE",
        "FONCTION": "CONT C JP"
      }
    ]

    // ONLY FOR CA
    if (Number(config.juridictionType) === 1) {
      const findGreffe = await models.HRCategories.findOne({
        where: {
          label: 'Greffe',
        },
        raw: true,
      })
      if (findGreffe) {
        CAFonctions.map(async (CA, index) => {
          await models.HRFonctions.create({ code: CA.FONCTION, label: CA.FONCTION_NL, category_id: findGreffe.id, rank: index })
        })
      }
    }
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
