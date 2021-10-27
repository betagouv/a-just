module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.HRFonctions.destroy({
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
      await models.HRFonctions.create({ ...categories[i], rank: i + 1 })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {
  },
}
