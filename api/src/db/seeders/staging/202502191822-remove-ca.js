const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      const backupIdToRemove = await models.HRBackups.findByLabel('CA DE DEMO')
      if(backupIdToRemove)
        await models.HRBackups.removeBackup(backupIdToRemove)
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
