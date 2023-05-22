module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const list = await models.ContentieuxReferentiels.findAll({
      order: [['code_import', 'asc']],
    })

    for (let i = 0; i < list.length; i++) {
      await list[i].update({ rank: i })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
