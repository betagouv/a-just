module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const findContract = await models.HRCategories.findOne({
      where: {
        label: 'Contractuel',
      },
      raw: true,
    })

    if (findContract) {
      await models.HRFonctions.create({
        label: 'Contractuel A',
        code: 'Contractuel A',
        category_id: findContract.id,
      })
      await models.HRFonctions.create({
        label: 'Contractuel B',
        code: 'Contractuel B',
        category_id: findContract.id,
      })
      await models.HRFonctions.create({
        label: 'Contractuel C',
        code: 'Contractuel C',
        category_id: findContract.id,
      })

      // reorder
      const findAllContactuels = await models.HRFonctions.findAll({
        where: {
          category_id: findContract.id,
        },
        order: [['label', 'asc']],
      })
      for(let i = 0; i < findAllContactuels.length; i++) {
        await findAllContactuels[i].update({
          rank: i,
        })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
