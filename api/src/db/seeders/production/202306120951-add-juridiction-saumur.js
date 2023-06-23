module.exports = {
  up: async (queryInterface, Sequelize, models) => {
      await models.TJ.create({
        i_elst: 948312,
        label: 'TJ SAUMUR',
        latitude: 47.2580836,
        longitude: -0.0748222,
        population: 136875,
        enabled: true,
        type: 'TGI'
      })
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
