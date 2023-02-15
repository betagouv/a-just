module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.HRCategories.destroy({
      where: {},
      truncate: true,
      force: true,
    })

    const categories = [{
      label: 'Magistrat',
    },{
      label: 'Fonctionnaire',
    },{
      label: 'Contractuel',
    }]

    for(let i = 0; i < categories.length; i++) {
      await models.HRCategories.create({ ...categories[i], rank: i + 1 })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {
  },
}
