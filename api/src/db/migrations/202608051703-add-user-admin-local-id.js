module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'local_admin_ids', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
  },
}
