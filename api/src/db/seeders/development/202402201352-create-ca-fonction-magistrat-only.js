import config from 'config';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const CAFonctions = [
      {
        "FONCTION": "PP",
        "FONCTION_NL": "Premier Président",
        "Ordre": 1
      },
      {
        "FONCTION": "1PC",
        "FONCTION_NL": "Premier Président de Chambre",
        "Ordre": 2
      },
      {
        "FONCTION": "PC",
        "FONCTION_NL": "Président de Chambre",
        "Ordre": 3
      },
      {
        "FONCTION": "PCINS",
        "FONCTION_NL": "Président de la Chambre de l'Instruction",
        "Ordre": 4
      },
      {
        "FONCTION": "CSG",
        "FONCTION_NL": "Conseiller chargé d'un Secrétariat Général",
        "Ordre": 5
      },
      {
        "FONCTION": "C",
        "FONCTION_NL": "Conseiller",
        "Ordre": 6
      },
      {
        "FONCTION": "VPP",
        "FONCTION_NL": "Vice-Président placé",
        "Ordre": 7
      },
      {
        "FONCTION": "JP",
        "FONCTION_NL": "Juge Placé auprès du Premier Président de la Cour d'Appel",
        "Ordre": 8
      },
      {
        "FONCTION": "MHFJS",
        "FONCTION_NL": "Magistrat Honoraire à fonction juridictionnelle S",
        "Ordre": 9
      },
      {
        "FONCTION": "JA",
        "FONCTION_NL": "Juriste Assistant",
        "Ordre": 10
      },
      {
        "FONCTION": "AS",
        "FONCTION_NL": "Assistant Spécialisé",
        "Ordre": 11
      }
    ]

    // ONLY FOR CA
    if (Number(config.juridictionType) === 1) {
      const findMag = await models.HRCategories.findOne({
        where: {
          label: 'Magistrat',
        },
        raw: true,
      })
      if (findMag) {
        await models.HRFonctions.destroy({
          where: {},
          truncate: true,
          force: true,
        })
        CAFonctions.map(async (CA, index) => {
          await models.HRFonctions.create({ code: CA.FONCTION, label: CA.FONCTION_NL, category_id: findMag.id, rank: index })
        })
      }
    }
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
