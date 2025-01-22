const { isCa } = require("../../../utils/ca");

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()===false) {
      const backupIdToRemove = await models.HRBackups.findByLabel('COPIE TJ ANNECY TEST')
      if(backupIdToRemove)
        await models.HRBackups.removeBackup(backupIdToRemove)
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
};
