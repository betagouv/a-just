const { isCa } = require('../../../utils/ca')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    if (isCa()) {
      
      const idsToExclude = [109, 22, 31, 113, 107, 108, 103, 111]
      const sequelize = models.HRBackups.sequelize 

      await sequelize.transaction(async (t) => {
        await models.HRBackups.update({ stat_exclusion: false }, { where: {}, transaction: t })
        await models.HRBackups.update({ stat_exclusion: true }, { where: { id: idsToExclude }, transaction: t })
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
