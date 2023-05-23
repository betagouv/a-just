module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const backups = await models.HRBackups.getAll()

    for (let i = 0; i < backups.length; i++) {
      await models.Activities.removeDuplicateDatas(backups[i].id)
      await models.Activities.cleanActivities(backups[i].id)
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
