module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRFonctions', 'calculatrice_is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
