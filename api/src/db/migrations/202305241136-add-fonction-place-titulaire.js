module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRFonctions', 'position', {
      type: Sequelize.STRING(255),
      defaultValue: 'Titulaire',
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
