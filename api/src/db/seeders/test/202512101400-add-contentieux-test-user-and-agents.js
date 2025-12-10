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
} from '../../../constants/access'
import { USER_ROLE_ADMIN } from '../../../constants/roles'

/**
 * Seeder for contentieux access E2E tests
 * Creates:
 * - utilisateurcontentieux@a-just.fr with access to all contentieux EXCEPT "Juges des Enfants"
 * - Agent A: no ventilation
 * - Agent B: ventilation in "Juges des Enfants" (10%) and "Contentieux de la Protection" (10%)
 * - Agent C: ventilation only in "Juges des Enfants" (10%)
 */
module.exports = {
  up: async (queryInterface, Sequelize, models) => {
    // ========== CREATE TEST USER ==========
    let testUser = await models.Users.findOne({
      where: { email: 'utilisateurcontentieux@a-just.fr' },
    })

    if (testUser) {
      // Clean up existing data
      await models.UsersAccess.destroy({
        where: { user_id: testUser.id },
      })
      await models.UserVentilations.destroy({
        where: { user_id: testUser.id },
      })
      
      const encryptedPassword = crypt.encryptPassword('@ContentieuxTest2024')
      await testUser.update({
        first_name: 'utilisateur',
        last_name: 'contentieux',
        password: encryptedPassword,
        status: 1,
        role: USER_ROLE_ADMIN,
      })
    } else {
      testUser = await models.Users.create(
        {
          email: 'utilisateurcontentieux@a-just.fr',
          first_name: 'utilisateur',
          last_name: 'contentieux',
          password: '@ContentieuxTest2024',
          status: 1,
          role: USER_ROLE_ADMIN,
        },
        true
      )

      const encryptedPassword = crypt.encryptPassword('@ContentieuxTest2024')
      await testUser.update({ password: encryptedPassword })
    }

    // Grant all tool access rights
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

    // Associate user with an HR backup (prefer test010, fallback to first available)
    let targetBackup = await models.HRBackups.findOne({
      where: { label: 'test010' },
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

    // Get all referentiels EXCEPT "Juges des Enfants"
    const allReferentiels = await models.ContentieuxReferentiels.findAll({
      where: {
        label: {
          [Sequelize.Op.ne]: 'Juges des Enfants',
        },
      },
      attributes: ['id'],
      raw: true,
    })

    // Set user's referentiel access (all except "Juges des Enfants")
    const referentielIds = allReferentiels.map((r) => r.id)
    await testUser.update({
      referentiel_ids: referentielIds,
    })

    console.log(`✅ [CONTENTIEUX SEEDER] Test user created with access to ${referentielIds.length} referentiels (excluding "Juges des Enfants")`)

    // ========== CREATE TEST AGENTS ==========
    if (!targetBackup) {
      console.warn('⚠️ [CONTENTIEUX SEEDER] No backup found, skipping agent creation')
      return
    }

    // Get referentiel IDs
    const jugesDesEnfantsRef = await models.ContentieuxReferentiels.findOne({
      where: { label: 'Juges des Enfants' },
    })
    const contentieuxProtectionRef = await models.ContentieuxReferentiels.findOne({
      where: { label: 'Contentieux de la Protection' },
    })

    if (!jugesDesEnfantsRef || !contentieuxProtectionRef) {
      console.warn('⚠️ [CONTENTIEUX SEEDER] Required referentiels not found')
      return
    }

    // Get a category for agents (prefer Magistrat)
    const magistratCategory = await models.HRCategories.findOne({
      where: { label: 'Magistrat' },
    })

    if (!magistratCategory) {
      console.warn('⚠️ [CONTENTIEUX SEEDER] Magistrat category not found')
      return
    }

    // Clean up existing test agents
    const existingAgents = await models.HumanResources.findAll({
      where: {
        matricule: {
          [Sequelize.Op.in]: ['TEST_AGENT_A', 'TEST_AGENT_B', 'TEST_AGENT_C'],
        },
      },
    })

    for (const agent of existingAgents) {
      // Delete related data
      await models.HRSituations.destroy({ where: { human_id: agent.id }, force: true })
      await models.HRVentilations.destroy({ where: { rh_id: agent.id }, force: true })
      await models.HRActivities.destroy({ where: { hr_id: agent.id }, force: true })
      await agent.destroy({ force: true })
    }

    // Create Agent A (no ventilation)
    const agentA = await models.HumanResources.create({
      first_name: 'Agent',
      last_name: 'A_NoVentilation',
      matricule: 'TEST_AGENT_A',
      backup_id: targetBackup.id,
      date_entree: new Date('2024-01-01'),
      date_sortie: null,
    })

    // Create situation for Agent A
    await models.HRSituations.create({
      human_id: agentA.id,
      category_id: magistratCategory.id,
      etp: 1.0,
      date_start: new Date('2024-01-01'),
      date_stop: null,
    })

    console.log('✅ [CONTENTIEUX SEEDER] Agent A created (no ventilation)')

    // Create Agent B (ventilation in 2 contentieux)
    const agentB = await models.HumanResources.create({
      first_name: 'Agent',
      last_name: 'B_TwoContentieux',
      matricule: 'TEST_AGENT_B',
      backup_id: targetBackup.id,
      date_entree: new Date('2024-01-01'),
      date_sortie: null,
    })

    const situationB = await models.HRSituations.create({
      human_id: agentB.id,
      category_id: magistratCategory.id,
      etp: 1.0,
      date_start: new Date('2024-01-01'),
      date_stop: null,
    })

    // Add ventilations for Agent B
    await models.HRActivities.create({
      hr_id: agentB.id,
      situation_id: situationB.id,
      contentieux_id: jugesDesEnfantsRef.id,
      percent: 10,
      date_start: new Date('2024-01-01'),
      date_stop: null,
    })

    await models.HRActivities.create({
      hr_id: agentB.id,
      situation_id: situationB.id,
      contentieux_id: contentieuxProtectionRef.id,
      percent: 10,
      date_start: new Date('2024-01-01'),
      date_stop: null,
    })

    console.log('✅ [CONTENTIEUX SEEDER] Agent B created (ventilation in Juges des Enfants + Contentieux de la Protection)')

    // Create Agent C (ventilation only in Juges des Enfants)
    const agentC = await models.HumanResources.create({
      first_name: 'Agent',
      last_name: 'C_OnlyJugesEnfants',
      matricule: 'TEST_AGENT_C',
      backup_id: targetBackup.id,
      date_entree: new Date('2024-01-01'),
      date_sortie: null,
    })

    const situationC = await models.HRSituations.create({
      human_id: agentC.id,
      category_id: magistratCategory.id,
      etp: 1.0,
      date_start: new Date('2024-01-01'),
      date_stop: null,
    })

    await models.HRActivities.create({
      hr_id: agentC.id,
      situation_id: situationC.id,
      contentieux_id: jugesDesEnfantsRef.id,
      percent: 10,
      date_start: new Date('2024-01-01'),
      date_stop: null,
    })

    console.log('✅ [CONTENTIEUX SEEDER] Agent C created (ventilation only in Juges des Enfants)')
    console.log('✅ [CONTENTIEUX SEEDER] All test data created successfully')
  },

  down: async (queryInterface, Sequelize, models) => {
    // Clean up test user
    const testUser = await models.Users.findOne({
      where: { email: 'utilisateurcontentieux@a-just.fr' },
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

    // Clean up test agents
    const existingAgents = await models.HumanResources.findAll({
      where: {
        matricule: {
          [Sequelize.Op.in]: ['TEST_AGENT_A', 'TEST_AGENT_B', 'TEST_AGENT_C'],
        },
      },
    })

    for (const agent of existingAgents) {
      await models.HRSituations.destroy({ where: { human_id: agent.id }, force: true })
      await models.HRVentilations.destroy({ where: { rh_id: agent.id }, force: true })
      await models.HRActivities.destroy({ where: { hr_id: agent.id }, force: true })
      await agent.destroy({ force: true })
    }

    console.log('✅ [CONTENTIEUX SEEDER] Test data cleaned up')
  },
}
