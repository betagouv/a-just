module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findEAMCat = await models.HRCategories.findOne({
      where: {
        label: 'Autour du magistrat',
      },
    })

    if (findEAMCat) {
      const fct = await models.HRFonctions.findOne({
        where: {
          code: 'Att. J',
          label: 'ATTACHÉ DE JUSTICE',
          category_detail: 'A',
          category_id: findEAMCat.dataValues.id,
        },
      })
      if (fct) fct.destroy()
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
