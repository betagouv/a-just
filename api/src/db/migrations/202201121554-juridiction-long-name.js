module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Juridictions', 'long_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })

    await queryInterface.addColumn('Juridictions', 'image_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
