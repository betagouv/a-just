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
