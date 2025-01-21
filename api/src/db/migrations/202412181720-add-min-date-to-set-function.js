module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("HRFonctions", "min_date_avalaible", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return;
  },
};
