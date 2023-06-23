module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findMag = await models.HRCategories.findOne({
      where: {
        label: 'Magistrat',
      },
      reaw: true,
    })

    if (!findMag) {
      return
    }

    const findMHFJ = await models.HRFonctions.findOne({
      where: {
        code: 'MHFJ',
      },
      raw: true,
    })

    if (!findMHFJ) {
      return
    }

    const list = await models.HRSituations.findAll({
      where: {
        fonction_id: findMHFJ.id,
      },
    })

    for (let i = 0; i < list.length; i++) {
      await list[i].update({
        category_id: findMag.id,
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
