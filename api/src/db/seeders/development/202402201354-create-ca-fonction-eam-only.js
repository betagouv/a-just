import config from 'config'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const CAFonctions = [
      {
        FONCTION: 'AS',
        FONCTION_NL: 'ASSISTANT SPECIALISE',
        Ordre: 1,
      },
      {
        FONCTION: 'JA',
        FONCTION_NL: 'JURISTE ASSISTANT',
        Ordre: 2,
      },
      {
        FONCTION: 'ADJ',
        FONCTION_NL: 'ASSISTANT DE JUSTICE',
        Ordre: 3,
      },
      {
        FONCTION: 'CONT A JP',
        FONCTION_NL: 'CONTRACTUEL A JUSTICE DE PROXIMITE',
        Ordre: 4,
      },
      {
        FONCTION: 'CONT B JP',
        FONCTION_NL: 'CONTRACTUEL B JUSTICE DE PROXIMITE',
        Ordre: 5,
      },
      {
        FONCTION: 'CONT C JP',
        FONCTION_NL: 'CONTRACTUEL C JUSTICE DE PROXIMITE',
        Ordre: 6,
      },
      {
        FONCTION: 'PPI',
        FONCTION_NL: 'ELEVE AVOCAT',
        Ordre: 7,
      },
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
