module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("ContentieuxReferentiels", "category", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return;
  },
};
