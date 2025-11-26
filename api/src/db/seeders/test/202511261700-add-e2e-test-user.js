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

/**
 * Seeder for E2E test user
 * Creates utilisateurtest@a-just.fr with full access to all tools
 * and associates with an HR backup for testing
 */
module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    console.log('🧪 [E2E SEEDER] Creating test user: utilisateurtest@a-just.fr')

    // Create the test user
    const testUser = await models.Users.create(
      {
        email: 'utilisateurtest@a-just.fr',
        first_name: 'utilisateur',
        last_name: 'test',
        password: '@bUgGD25gX1b',
        status: 1,
        role: null, // Not admin, not super admin - regular user
      },
      true
    )

    // Encrypt the password
    const encryptedPassword = crypt.encryptPassword('@bUgGD25gX1b')
    await testUser.update({ password: encryptedPassword })

    console.log(`✅ [E2E SEEDER] Test user created with ID: ${testUser.id}`)

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

    console.log('🔑 [E2E SEEDER] Granting access rights...')
    for (const accessId of allAccessRights) {
      await models.UsersAccess.create({
        user_id: testUser.id,
        access_id: accessId,
      })
      console.log(`   ✓ ${accessToString(accessId)}`)
    }

    // Associate user with an HR backup (find the first available one)
    const firstBackup = await models.HRBackups.findOne({
      order: [['id', 'ASC']],
    })

    if (firstBackup) {
      await models.UserVentilations.create({
        user_id: testUser.id,
        hr_backup_id: firstBackup.id,
      })
      console.log(`✅ [E2E SEEDER] User associated with HR backup: ${firstBackup.label} (ID: ${firstBackup.id})`)
    } else {
      console.warn('⚠️  [E2E SEEDER] No HR backup found - user will not have access to any jurisdiction')
    }

    console.log('✅ [E2E SEEDER] Test user setup complete!')
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
      console.log('🧹 [E2E SEEDER] Test user removed')
    }
  },
}
