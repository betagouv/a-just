module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("HRFonctions", "recoded_function", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return;
  },
};
