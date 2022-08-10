module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const activities = await models.Activities.findAll()

    for (let i = 0; i < activities.length; i++) {
      const acti = activities[i]
  
      await acti.update({
        original_entrees: acti.dataValues.entrees,
        entrees: null,
        original_sorties: acti.dataValues.sorties,
        sorties: null,
        original_stock: acti.dataValues.stock,
        stock: null,
      })
    }

  },
  down: (/*queryInterface , Sequelize*/) => {},
}
