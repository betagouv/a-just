const { model } = require("mongoose")

module.exports = {
  up: async (queryInterface, Sequelize, models) => {

    const user = await models.Users.findOne({
        where: {
            email: "utilisateurtest@a-just.fr"
        },
    })

    const backups = await models.HRBackups.getAll()

    if (!backups.length  && !user) 
      return
    for (let i = 0; i < backups.length; i++) {
      await  models.UserVentilations.create({
        user_id: user.dataValues.id,
        hr_backup_id: backups[i].id,
      })
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}