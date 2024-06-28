module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRComments', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })




  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}