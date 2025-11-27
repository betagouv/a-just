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
    console.log('🧪 [E2E SEEDER] Setting up test user: utilisateurtest@a-just.fr')

    // Check if user already exists
    let testUser = await models.Users.findOne({
      where: { email: 'utilisateurtest@a-just.fr' },
    })

    if (testUser) {
      console.log(`ℹ️  [E2E SEEDER] Test user already exists (ID: ${testUser.id}), updating...`)
      
      // Delete all existing access rights to ensure clean state
      await models.UsersAccess.destroy({
        where: { user_id: testUser.id },
      })
      console.log('   🗑️  Deleted existing access rights')
      
      // Delete existing HR backup associations
      await models.UserVentilations.destroy({
        where: { user_id: testUser.id },
      })
      console.log('   🗑️  Deleted existing HR backup associations')
      
      // Update user details
      const encryptedPassword = crypt.encryptPassword('@bUgGD25gX1b')
      await testUser.update({
        first_name: 'utilisateur',
        last_name: 'test',
        password: encryptedPassword,
        status: 1,
        role: null,
      })
      console.log('   ✅ Updated user details')
    } else {
      // Create the test user
      testUser = await models.Users.create(
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

    console.log('🔑 [E2E SEEDER] Granting access rights...')
    for (const accessId of allAccessRights) {
      await models.UsersAccess.create({
        user_id: testUser.id,
        access_id: accessId,
      })
      console.log(`   ✓ ${accessToString(accessId)}`)
    }

    // Associate user with an HR backup (prefer test010, fallback to first available)
    console.log('🔍 [E2E SEEDER] Looking for HR backup to associate with user...')
    let targetBackup = await models.HRBackups.findOne({
      where: { label: 'test010' },
    })

    if (!targetBackup) {
      console.log('⚠️  [E2E SEEDER] test010 not found, using first available backup')
      targetBackup = await models.HRBackups.findOne({
        order: [['id', 'ASC']],
      })
    }

    if (targetBackup) {
      await models.UserVentilations.create({
        user_id: testUser.id,
        hr_backup_id: targetBackup.id,
      })
      console.log(`✅ [E2E SEEDER] User associated with HR backup:`)
      console.log(`   - ID: ${targetBackup.id}`)
      console.log(`   - Label: ${targetBackup.label}`)
      console.log(`   - Type: ${targetBackup.type || 'N/A'}`)

      // Check if this backup is visible via TJ.isVisible
      console.log('🔍 [E2E SEEDER] Checking TJ visibility for this backup...')
      const tjRecord = await models.TJ.findOne({
        where: { label: targetBackup.label },
        raw: true,
      })
      if (tjRecord) {
        console.log(`   - TJ record found: ID=${tjRecord.id}, enabled=${tjRecord.enabled}`)
        console.log(`   - Will be visible: ${!tjRecord || tjRecord.enabled ? 'YES' : 'NO'}`)
      } else {
        console.log(`   - No TJ record found (will default to visible: YES)`)
      }

      // Verify the association was created
      const ventilationCheck = await models.UserVentilations.findOne({
        where: {
          user_id: testUser.id,
          hr_backup_id: targetBackup.id,
        },
      })
      console.log(`   - UserVentilations association created: ${ventilationCheck ? 'YES' : 'NO'}`)
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
