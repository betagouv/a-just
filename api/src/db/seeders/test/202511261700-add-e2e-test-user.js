import { crypt } from '../../../utils'
import {
  USER_ACCESS_DASHBOARD_READER,
  USER_ACCESS_DASHBOARD_WRITER,
  USER_ACCESS_VENTILATIONS_READER,
  USER_ACCESS_VENTILATIONS_WRITER,
  USER_ACCESS_ACTIVITIES_READER,
  USER_ACCESS_ACTIVITIES_WRITER,
  USER_ACCESS_AVERAGE_TIME_READER,
  USER_ACCESS_AVERAGE_TIME_WRITER,
  USER_ACCESS_CALCULATOR_READER,
  USER_ACCESS_CALCULATOR_WRITER,
  USER_ACCESS_SIMULATOR_READER,
  USER_ACCESS_SIMULATOR_WRITER,
  USER_ACCESS_WHITE_SIMULATOR_READER,
  USER_ACCESS_WHITE_SIMULATOR_WRITER,
  USER_ACCESS_REAFFECTATOR_READER,
  USER_ACCESS_REAFFECTATOR_WRITER,
  HAS_ACCESS_TO_MAGISTRAT,
  HAS_ACCESS_TO_GREFFIER,
  HAS_ACCESS_TO_CONTRACTUEL,
  accessToString,
} from '../../../constants/access'
import { USER_ROLE_ADMIN } from '../../../constants/roles'

/**
 * Seeder for E2E test user
 * Creates utilisateurtest@a-just.fr with full access to all tools
 * and associates with an HR backup for testing
 */
module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    // Check if user already exists
    let testUser = await models.Users.findOne({
      where: { email: 'utilisateurtest@a-just.fr' },
    })

    if (testUser) {
      // Delete all existing access rights to ensure clean state
      await models.UsersAccess.destroy({
        where: { user_id: testUser.id },
      })

      // Delete existing HR backup associations
      await models.UserVentilations.destroy({
        where: { user_id: testUser.id },
      })

      // Update user details
      const encryptedPassword = crypt.encryptPassword('@bUgGD25gX1b')
      await testUser.update({
        first_name: 'utilisateur',
        last_name: 'test',
        password: encryptedPassword,
        status: 1,
        role: USER_ROLE_ADMIN,
      })
    } else {
      // Create the test user
      testUser = await models.Users.create(
        {
          email: 'utilisateurtest@a-just.fr',
          first_name: 'utilisateur',
          last_name: 'test',
          password: '@bUgGD25gX1b',
          status: 1,
          role: USER_ROLE_ADMIN, // Admin role required for access.cy.js tests
        },
        true
      )

      // Encrypt the password
      const encryptedPassword = crypt.encryptPassword('@bUgGD25gX1b')
      await testUser.update({ password: encryptedPassword })
    }

    // Grant all access rights (reader + writer for all tools)
    const allAccessRights = [
      USER_ACCESS_DASHBOARD_READER,
      USER_ACCESS_DASHBOARD_WRITER,
      USER_ACCESS_VENTILATIONS_READER,
      USER_ACCESS_VENTILATIONS_WRITER,
      USER_ACCESS_ACTIVITIES_READER,
      USER_ACCESS_ACTIVITIES_WRITER,
      USER_ACCESS_AVERAGE_TIME_READER,
      USER_ACCESS_AVERAGE_TIME_WRITER,
      USER_ACCESS_CALCULATOR_READER,
      USER_ACCESS_CALCULATOR_WRITER,
      USER_ACCESS_SIMULATOR_READER,
      USER_ACCESS_SIMULATOR_WRITER,
      USER_ACCESS_WHITE_SIMULATOR_READER,
      USER_ACCESS_WHITE_SIMULATOR_WRITER,
      USER_ACCESS_REAFFECTATOR_READER,
      USER_ACCESS_REAFFECTATOR_WRITER,
      HAS_ACCESS_TO_MAGISTRAT,
      HAS_ACCESS_TO_GREFFIER,
      HAS_ACCESS_TO_CONTRACTUEL,
    ]

    for (const accessId of allAccessRights) {
      await models.UsersAccess.create({
        user_id: testUser.id,
        access_id: accessId,
      })
    }

    // Associate user with an HR backup (prefer E2E Test Backup, fallback to first available)
    let targetBackup = await models.HRBackups.findOne({
      where: { label: 'E2E Test Backup' },
    })

    if (!targetBackup) {
      targetBackup = await models.HRBackups.findOne({
        order: [['id', 'ASC']],
      })
    }

    if (targetBackup) {
      await models.UserVentilations.create({
        user_id: testUser.id,
        hr_backup_id: targetBackup.id,
      })
    }

    console.log('✅ [E2E SEEDER] Test user setup complete')
  },

  down: async (queryInterface, Sequelize, models) => {
    // Clean up test user
    const testUser = await models.Users.findOne({
      where: { email: 'utilisateurtest@a-just.fr' },
    })

    if (testUser) {
      await models.UsersAccess.destroy({
        where: { user_id: testUser.id },
        force: true,
      })
      await models.UserVentilations.destroy({
        where: { user_id: testUser.id },
        force: true,
      })
      await testUser.destroy({ force: true })
    }
  },
}
