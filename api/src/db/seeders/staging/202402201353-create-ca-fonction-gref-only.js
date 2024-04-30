import config from 'config';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const CAFonctions = [
      {
        "FONCTION": "DG",
        "FONCTION_NL": "Directeur de greffe",
        "Ordre": 1
      },
      {
        "FONCTION": "CHCAB",
        "FONCTION_NL": "CHEF DE CABINET",
        "Ordre": 2
      },
      {
        "FONCTION": "DG-A",
        "FONCTION_NL": "Directeur de greffe adjoint",
        "Ordre": 3
      },
      {
        "FONCTION": "CM",
        "FONCTION_NL": "Chargé de mission",
        "Ordre": 4
      },
      {
        "FONCTION": "CS",
        "FONCTION_NL": "Chef de service",
        "Ordre": 5
      },
      {
        "FONCTION": "A",
        "FONCTION_NL": "A",
        "Ordre": 6
      },
      {
        "FONCTION": "B",
        "FONCTION_NL": "B GREFFIER",
        "Ordre": 7
      },
      {
        "FONCTION": "SA",
        "FONCTION_NL": "SA",
        "Ordre": 8
      },
      {
        "FONCTION": "CB",
        "FONCTION_NL": "CB",
        "Ordre": 9
      },
      {
        "FONCTION": "CT",
        "FONCTION_NL": "CT",
        "Ordre": 10
      },
      {
        "FONCTION": "A PLACÉ",
        "FONCTION_NL": "A PLACÉ",
        "Ordre": 11
      },
      {
        "FONCTION": "B GREF  PLACÉ",
        "FONCTION_NL": "B GREFFIER PLACÉ",
        "Ordre": 12
      },
      {
        "FONCTION": "B PLACÉ",
        "FONCTION_NL": "B PLACÉ",
        "Ordre": 13
      },
      {
        "FONCTION": "CB PLACÉ",
        "FONCTION_NL": "CB PLACÉ",
        "Ordre": 14
      },
      {
        "FONCTION": "CT PLACÉ",
        "FONCTION_NL": "CT PLACÉ",
        "Ordre": 15
      },
      {
        "FONCTION": "GRES",
        "FONCTION_NL": "GREFFIER RESERVISTE",
        "Ordre": 16
      },
      {
        "FONCTION": "CONT A",
        "FONCTION_NL": "CONTRACTUEL A",
        "Ordre": 17
      },
      {
        "FONCTION": "CONT A JP",
        "FONCTION_NL": "CONTRACTUEL A JUSTICE DE PROXIMITE",
        "Ordre": 18
      },
      {
        "FONCTION": "CONT B",
        "FONCTION_NL": "CONTRACTUEL B",
        "Ordre": 19
      },
      {
        "FONCTION": "CONT B JP",
        "FONCTION_NL": "CONTRACTUEL B JUSTICE DE PROXIMITE",
        "Ordre": 20
      },
      {
        "FONCTION": "CONT C",
        "FONCTION_NL": "CONTRACTUEL C",
        "Ordre": 21
      },
      {
        "FONCTION": "CONT C JP",
        "FONCTION_NL": "CONTRACTUEL C JUSTICE DE PROXIMITE",
        "Ordre": 22
      },
      {
        "FONCTION": "CONT CB",
        "FONCTION_NL": "CONTRACTUEL CB",
        "Ordre": 23
      },
      {
        "FONCTION": "CONT CT",
        "FONCTION_NL": "CONTRACTUEL CT",
        "Ordre": 24
      },
      {
        "FONCTION": "VAC",
        "FONCTION_NL": "VACATAIRE",
        "Ordre": 25
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
