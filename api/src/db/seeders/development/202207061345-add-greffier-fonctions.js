module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findFonc = await models.HRCategories.findOne({
      where: {
        label: 'Fonctionnaire',
      },
      raw: true,
    })

    if (findFonc) {
      const list = [
        {
          label: 'A',
          code: 'A',
        },
        {
          label: 'B',
          code: 'B',
        },
        {
          label: 'CB',
          code: 'CB',
        },
        {
          label: 'CT',
          code: 'CT',
        },
      ]
      await models.HRFonctions.destroy({
        where: {
          category_id: findFonc.id,
        },
      })
      for (let i = 0; i < list.length; i++) {
        await models.HRFonctions.create({
          ...list[i],
          rank: i + 1,
          category_id: findFonc.id,
        })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
