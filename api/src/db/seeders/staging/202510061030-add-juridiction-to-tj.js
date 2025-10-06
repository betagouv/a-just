module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const allTJ = await models.TJ.findAll()
    for (let i = 0; i < allTJ.length; i++) {
      const findHRBackup = await models.HRBackups.findOne({
        where: {
          label: allTJ[i].dataValues.label,
        },
      })
      if (findHRBackup) {
        await allTJ[i].update({
          backup_id: findHRBackup.dataValues.id,
        })
      }
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
