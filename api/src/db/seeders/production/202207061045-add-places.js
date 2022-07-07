module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findMag = await models.HRCategories.findOne({
      where: {
        label: 'Magistrat',
      },
      raw: true,
    })

    if (findMag) {
      const list = [
        {
          label: 'VICE-PRÉSIDENT PLACÉ',
          code: 'VP PLACÉ',
        },
        {
          label: 'JUGE PLACÉ',
          code: 'J. PLACÉ',
        },
      ]
      const maxRank = await models.HRFonctions.max('rank', {
        category_id: findMag.id,
      })
      for (let i = 0; i < list.length; i++) {
        await models.HRFonctions.create({
          ...list[i],
          rank: maxRank + i + 1,
          category_id: findMag.id,
        })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
