module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.Activities.update({ entrees: null, sorties: null, stock: null }, { where : {} })
    await models.HistoriesActivitiesUpdate.destroy({ where : {}, force: true })
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
