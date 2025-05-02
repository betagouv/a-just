module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("HRBackups", "stat_exclusion", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return;
  },
};
