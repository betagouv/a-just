module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('UserFeedback', 'recontact', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('UserFeedback', 'recontact')
  },
}
