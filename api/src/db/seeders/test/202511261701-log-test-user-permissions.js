import { accessToString } from '../../../constants/access'
import { roleToString } from '../../../constants/roles'

/**
 * Diagnostic seeder to log test user permissions
 * This runs AFTER the test user is created and helps verify E2E test setup
 */
module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    console.log('\n' + '='.repeat(80))
    console.log('🔍 [E2E DIAGNOSTIC] Checking test user permissions in database')
    console.log('='.repeat(80))

    // Find the test user
    const testUser = await models.Users.findOne({
      where: { email: 'utilisateurtest@a-just.fr' },
      attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'status'],
    })

    if (!testUser) {
      console.error('❌ [E2E DIAGNOSTIC] TEST USER NOT FOUND: utilisateurtest@a-just.fr')
      console.error('   This will cause all E2E tests to fail!')
      console.log('='.repeat(80) + '\n')
      return
    }

    console.log('\n📋 USER DETAILS:')
    console.log(`   Email:      ${testUser.email}`)
    console.log(`   Name:       ${testUser.first_name} ${testUser.last_name}`)
    console.log(`   User ID:    ${testUser.id}`)
    console.log(`   Role:       ${testUser.role ? roleToString(testUser.role) : 'Regular User (no admin role)'}`)
    console.log(`   Status:     ${testUser.status === 1 ? 'Active' : 'Inactive'}`)

    // Get all access rights
    const userAccess = await models.UsersAccess.findAll({
      where: { user_id: testUser.id },
      attributes: ['access_id'],
      order: [['access_id', 'ASC']],
    })

    console.log('\n🔑 ACCESS RIGHTS (' + userAccess.length + ' total):')
    if (userAccess.length === 0) {
      console.error('   ❌ NO ACCESS RIGHTS FOUND - User cannot access any tools!')
    } else {
      userAccess.forEach((access) => {
        const accessName = accessToString(access.access_id)
        console.log(`   ✓ [${access.access_id}] ${accessName}`)
      })
    }

    // Get HR backup associations
    const userVentilations = await models.UserVentilations.findAll({
      where: { user_id: testUser.id },
      attributes: ['hr_backup_id'],
      include: [
        {
          model: models.HRBackups,
          attributes: ['id', 'label'],
        },
      ],
    })

    console.log('\n🏛️  HR BACKUP ASSOCIATIONS (' + userVentilations.length + ' total):')
    if (userVentilations.length === 0) {
      console.error('   ❌ NO HR BACKUP ASSOCIATIONS - User cannot access any jurisdiction!')
    } else {
      userVentilations.forEach((ventilation) => {
        const backup = ventilation.HRBackup || {}
        console.log(`   ✓ [ID: ${ventilation.hr_backup_id}] ${backup.label || 'Unknown'}`)
      })
    }

    // Summary
    console.log('\n📊 SUMMARY:')
    const hasAccess = userAccess.length > 0
    const hasBackup = userVentilations.length > 0
    const isReady = hasAccess && hasBackup

    if (isReady) {
      console.log('   ✅ Test user is properly configured for E2E tests')
      console.log('   ✅ Has access rights: YES')
      console.log('   ✅ Has HR backup: YES')
    } else {
      console.error('   ❌ Test user is NOT properly configured!')
      console.error(`   ${hasAccess ? '✅' : '❌'} Has access rights: ${hasAccess ? 'YES' : 'NO'}`)
      console.error(`   ${hasBackup ? '✅' : '❌'} Has HR backup: ${hasBackup ? 'YES' : 'NO'}`)
    }

    console.log('='.repeat(80) + '\n')
  },

  down: (/*queryInterface , Sequelize*/) => {
    // No-op: this is just a diagnostic seeder
  },
}
