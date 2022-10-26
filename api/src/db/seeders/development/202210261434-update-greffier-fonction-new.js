module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findFonc = await models.HRCategories.findOne({
      where: {
        label: 'Fonctionnaire',
      },
      raw: true,
    })

    if (findFonc) {
      const findBP = await models.HRFonctions.findOne({
        where: {
          code: 'B',
        },
      })
      if (findBP) {
        await findBP.update({
          label: 'SA',
          code: 'SA',
        })
      }

      await models.HRFonctions.create({
        label: 'Vacataire',
        code: 'Vacataire',
        rank: 100,
        category_id: findFonc.id,
      })

      await models.HRFonctions.create({
        label: 'B contractuel',
        code: 'B contractuel',
        rank: 100,
        category_id: findFonc.id,
      })

      await models.HRFonctions.create({
        label: 'C contractuel',
        code: 'C contractuel',
        rank: 100,
        category_id: findFonc.id,
      })

      // reorder
      const findAllFonctionnaire = await models.HRFonctions.findAll({
        where: {
          category_id: findFonc.id,
        },
        order: [
          ['rank', 'asc'],
          ['id', 'asc'],
        ],
      })
      for (let i = 0; i < findAllFonctionnaire.length; i++) {
        await findAllFonctionnaire[i].update({
          rank: i,
        })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
