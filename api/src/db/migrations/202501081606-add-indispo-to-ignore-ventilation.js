module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      "ContentieuxReferentiels",
      "check_ventilation",
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }
    );
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return;
  },
};
