import config from 'config';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const CAFonctions = [
      {
        "FONCTION": "JA",
        "FONCTION_NL": "Juriste Assistant"
      },
      {
        "FONCTION": "MHFJS",
        "FONCTION_NL": "Magistrat Honoraire à fonction juriditionnelle S"
      },
      {
        "FONCTION": "JP",
        "FONCTION_NL": "Juge Placé auprès du Premier Président de la Cour d'Appel"
      },
      {
        "FONCTION": "C",
        "FONCTION_NL": "Conseiller"
      },
      {
        "FONCTION": "PC",
        "FONCTION_NL": "Président de Chambre"
      },
      {
        "FONCTION": "PCINS",
        "FONCTION_NL": "Président de la Chambre de l'Instruction"
      },
      {
        "FONCTION": "1PC",
        "FONCTION_NL": "Premier Président de Chambre"
      },
      {
        "FONCTION": "VPP",
        "FONCTION_NL": "Vice-Président placé"
      },
      {
        "FONCTION": "PP",
        "FONCTION_NL": "Premier Président"
      },
      {
        "FONCTION": "CSG",
        "FONCTION_NL": "Conseiller chargé d'un Secrétariat Général"
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
