module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findEOJ = await models.HRCategories.findOne({
      where: {
        label: 'Autour du Juge',
      },
    })

    const findGreff = await models.HRCategories.findOne({
      where: {
        label: 'Greffe',
      },
    })

    if (findEOJ && findGreff) {
      const findGreffeVacataire = await models.HRFonctions.findOne({
        where: {
          label: 'VACATAIRE',
          category_id: findGreff.dataValues.id,
        },
      })

      const findEOJVacataire = await models.HRFonctions.findOne({
        where: {
          label: 'Vacataire',
          category_id: findEOJ.dataValues.id,
        },
      })

      const allSituationEOJVacataire = await models.HRSituations.findAll({
        where: {
          fonction_id: findEOJVacataire.dataValues.id,
        },
      })

      for (let i = 0; i < allSituationEOJVacataire.length; i++) {
        if (allSituationEOJVacataire[i])
          await allSituationEOJVacataire[i].update({
            fonction_id: findGreffeVacataire.dataValues.id,
            category_id: findGreff.dataValues.id,
          })
      }

      await models.HRFonctions.destroy({
        where: {
          id: findEOJVacataire.dataValues.id,
        },
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
