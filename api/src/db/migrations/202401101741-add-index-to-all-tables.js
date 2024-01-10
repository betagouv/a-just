module.exports = {
  up: async (queryInterface /*, Sequelize*/) => {
    await queryInterface.addIndex('ContentieuxOptions', ['backup_id'])
    await queryInterface.addIndex('ContentieuxReferentiels', ['code_import'])
    await queryInterface.addIndex('HRComments', ['human_id'])
    await queryInterface.addIndex('HRIndisponibilities', ['hr_id'])
    await queryInterface.addIndex('HRSituations', ['human_id'])
    await queryInterface.addIndex('Logs', ['code_id', 'user_id'])
    await queryInterface.addIndex('NewsUserLog', ['user_id', 'event_type'])
    await queryInterface.addIndex('NewsUserLog', ['user_id', 'event_type', 'news_id'])
    await queryInterface.addIndex('OptionsBackupJuridictions', ['option_backup_id'])
    await queryInterface.addIndex('TJ', ['label'])
    await queryInterface.addIndex('TJ', ['parent_id'])
    await queryInterface.addIndex('TJDetails', ['juridiction_id'])
    await queryInterface.addIndex('TJDetails', ['juridiction_id', 'category_id'])
    await queryInterface.addIndex('UsersAccess', ['user_id'])
    await queryInterface.addIndex('UserVentilations', ['user_id'])
    await queryInterface.addIndex('UserVentilations', ['hr_backup_id'])
    await queryInterface.addIndex('UserVentilations', ['user_id', 'hr_backup_id'])
  },
  down: async (/*queryInterface /*, Sequelize*/) => {},
}
