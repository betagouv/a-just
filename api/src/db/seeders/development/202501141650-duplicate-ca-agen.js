const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      //await models.HRBackups.duplicateBackup(1,'DEMO TEST 4')
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
