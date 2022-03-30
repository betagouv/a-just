module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const hr = await models.HumanResources.findAll()

    for(let i = 0; i < hr.length; i++) {
      await hr[i].update({ etp: hr[i].posad })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {
  },
}
