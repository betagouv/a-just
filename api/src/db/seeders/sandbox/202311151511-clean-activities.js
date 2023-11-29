module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    await models.Activities.removeDuplicateDatas(null, true)
    await queryInterface.addIndex('Activities', ['hr_backup_id', 'periode', 'contentieux_id'], {
      name: 'activities-backup-periode-cont',
      unique: true,
    })
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
