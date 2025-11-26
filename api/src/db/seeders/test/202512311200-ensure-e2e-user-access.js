const {
  USER_ACCESS_DASHBOARD_READER,
  USER_ACCESS_VENTILATIONS_READER,
  USER_ACCESS_ACTIVITIES_READER,
  USER_ACCESS_AVERAGE_TIME_READER,
  USER_ACCESS_AVERAGE_TIME_WRITER,
  USER_ACCESS_CALCULATOR_READER,
  USER_ACCESS_SIMULATOR_READER,
  USER_ACCESS_WHITE_SIMULATOR_READER,
  HAS_ACCESS_TO_MAGISTRAT,
  HAS_ACCESS_TO_GREFFIER,
} = require('../../../constants/access')
const { crypt } = require('../../../utils')

module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    const email = 'utilisateurtest@a-just.fr'
    const firstName = 'Utilisateur'
    const lastName = 'Test'
    const plainPassword = '@bUgGD25gX1b'

    let user = await models.Users.findOne({ where: { email } })

    if (!user) {
      user = await models.Users.create(
        {
          email,
          first_name: firstName,
          last_name: lastName,
          password: crypt.encryptPassword(plainPassword),
          status: 1,
          role: 2,
        },
        true,
      )
    } else {
      if (user.dataValues.status !== 1 || user.dataValues.role !== 2) {
        await user.update({ status: 1, role: 2 })
      }
      await user.update({ password: crypt.encryptPassword(plainPassword) })
    }

    const accessIds = [
      USER_ACCESS_DASHBOARD_READER,
      USER_ACCESS_VENTILATIONS_READER,
      USER_ACCESS_ACTIVITIES_READER,
      USER_ACCESS_AVERAGE_TIME_READER,
      USER_ACCESS_AVERAGE_TIME_WRITER,
      USER_ACCESS_CALCULATOR_READER,
      USER_ACCESS_SIMULATOR_READER,
      USER_ACCESS_WHITE_SIMULATOR_READER,
      HAS_ACCESS_TO_MAGISTRAT,
      HAS_ACCESS_TO_GREFFIER,
    ]

    await models.UsersAccess.updateAccess(user.dataValues.id, accessIds)

    // Ensure the user has at least one TJ/HRBackup via UserVentilations
    // Try a known label first, otherwise fall back to the first available backup
    const BACKUP_LABEL = 'test010'
    let backup = await models.HRBackups.findOne({
      attributes: ['id', 'label'],
      where: { label: BACKUP_LABEL },
      raw: true,
    })

    if (!backup) {
      backup = await models.HRBackups.findOne({
        attributes: ['id', 'label'],
        order: [['id', 'ASC']],
        raw: true,
      })
    }

    if (backup?.id) {
      await models.UserVentilations.pushVentilation(user.dataValues.id, backup.id)
    }
  },
  down: (/*queryInterface , Sequelize*/) => {},
}
