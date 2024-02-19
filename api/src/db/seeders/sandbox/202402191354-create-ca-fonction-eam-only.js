import config from 'config';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const CAFonctions = [
      {
        "FONCTION": "AS",
        "FONCTION_NL": "ASSISTANT SPECIALISE"
      },
      {
        "FONCTION": "ADJ",
        "FONCTION_NL": "ASSISTANT DE JUSTICE"
      },
      {
        "FONCTION": "JA",
        "FONCTION_NL": "JURISTE ASSISTANT"
      },
      {
        "FONCTION": "PPI",
        "FONCTION_NL": "ELEVE AVOCAT"
      },
      {
        "FONCTION": "CONT A JP",
        "FONCTION_NL": "CONTRACTUEL A JUSTICE DE PROXIMITE"
      },
      {
        "FONCTION": "CONT B JP",
        "FONCTION_NL": "CONTRACTUEL B JUSTICE DE PROXIMITE"
      },
      {
        "FONCTION": "CONT C JP",
        "FONCTION_NL": "CONTRACTUEL C JUSTICE DE PROXIMITE"
      }
    ]

    // ONLY FOR CA
    if (Number(config.juridictionType) === 1) {
      const findEAM = await models.HRCategories.findOne({
        where: {
          label: 'Autour du magistrat',
        },
        raw: true,
      })
      if (findEAM) {
        CAFonctions.map(async (CA, index) => {
          await models.HRFonctions.create({ code: CA.FONCTION, label: CA.FONCTION_NL, category_id: findEAM.id, rank: index })
        })
      }
    }
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
