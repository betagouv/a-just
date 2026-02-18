import { default as server } from '../src/index'
import { accessList, accessToString } from '../src/constants/access'
import routeUser from './api/RouteUser.test.js'
import routeChangeUserData from './api/RouteChangeUserData.test.js'
import routeCalcultator from './api/RouteCalculator.test.js'
//import routeSimulator from './api/RouteSimulator.test.js'
import routeVentilateur from './api/RouteVentilateur.test.js'
import routePanorama from './api/RoutePanorama.test.js'
import routeActivities from './api/RouteActivities.test.js'
import { USER_ADMIN_EMAIL, USER_ADMIN_PASSWORD } from './constants/user'
import { assert } from 'chai'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

console.warn = () => { }
console.error = () => { }

import config from 'config'
import { onLoginAdminApi, onUpdateAccountApi, onGetUserDataApi } from './routes/user'
import { onGetAllBackupsApi } from './routes/hr'
import { JURIDICTION_TEST_NAME } from './constants/juridiction'

const datas = {
  adminId: null,
  adminToken: null,
  userId: null,
  userToken: null,
}

/**
 * Find backup ID by label from the admin's backup list
 * @param {string} label - Backup label to search for (e.g., ""E2E Test Backup"")
 * @returns {number|null} - Backup ID or null if not found
 */
function getBackupIdByLabel(label) {
  if (!datas.adminBackups || datas.adminBackups.length === 0) {
    console.warn(`[BACKUP LOOKUP] No backups available for admin`)
    return null
  }

  const backup = datas.adminBackups.find(b => b.label === label)

  if (!backup) {
    console.warn(`[BACKUP LOOKUP] Backup with label "${label}" not found`)
    console.warn(`[BACKUP LOOKUP] Available backups:`, datas.adminBackups.map(b => b.label))
    return null
  }

  console.log(`[BACKUP LOOKUP] Found backup "${label}" with ID: ${backup.id}`)
  return backup.id
}

/**
 * Build A-JUST context object for test reporting
 * @returns {object} Context with user, backup, and rights info
 */
function buildAJustContext() {
  const ctx = {
    user: {
      id: datas.adminId || null,
      email: USER_ADMIN_EMAIL || null,
      role: 'ADMIN',
    },
    backup: {
      id: datas.adminBackupId || null,
      label: datas.adminBackups && datas.adminBackups.length > 0
        ? datas.adminBackups.find(b => b.id === datas.adminBackupId)?.label || null
        : null,
    },
    rights: {
      tools: [],
      referentiels: datas.adminReferentielIds || 'all',
    },
  }

  // Build tools list from adminAccess
  if (Array.isArray(datas.adminAccess)) {
    const toolMap = new Map()
    for (const acc of datas.adminAccess) {
      const id = acc.id || acc
      const label = accessToString(id)
      if (!label) continue

      // Parse tool name and read/write from label (e.g. "Panorama - lecture")
      const parts = label.split(' - ')
      const toolName = parts[0] || label
      const mode = parts[1] || ''

      if (!toolMap.has(toolName)) {
        toolMap.set(toolName, { name: toolName, canRead: false, canWrite: false })
      }
      const tool = toolMap.get(toolName)
      if (/lecture/i.test(mode)) tool.canRead = true
      if (/écriture|write/i.test(mode)) tool.canWrite = true
    }
    ctx.rights.tools = Array.from(toolMap.values())
  }

  return ctx
}

// Context storage for separate JSON file approach
const testContexts = {}
const contextFilePath = path.join(__dirname, 'reports', 'test-contexts.json')

before((done) => {
  console.log('BEFORE WAITING SERVER')

  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, 'reports')
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  // Initialize empty context file
  fs.writeFileSync(contextFilePath, JSON.stringify({}, null, 2))

  server.isReady = function () {
    console.log('config', config)

    done()
  }
})

beforeEach(function () {
  // Write A-JUST context to separate JSON file for report generation
  if (datas.adminId && datas.adminToken) {
    const ctx = buildAJustContext()
    const testFullTitle = this.currentTest.fullTitle()
    // Normalize to lowercase for case-insensitive lookup
    const normalizedKey = testFullTitle.toLowerCase()

    // Store in memory
    testContexts[normalizedKey] = ctx

    // Write to file (append mode - read, update, write)
    try {
      const existing = fs.existsSync(contextFilePath)
        ? JSON.parse(fs.readFileSync(contextFilePath, 'utf8'))
        : {}
      existing[normalizedKey] = ctx
      fs.writeFileSync(contextFilePath, JSON.stringify(existing, null, 2))
    } catch (err) {
      console.warn('Failed to write test context:', err.message)
    }
  }
})

after(async function () {
  // remove created user if exists
  if (datas.userId && datas.adminToken) {
    await axios.delete(`${config.serverUrl}/users/remove-account-test/${datas.userId}`, {
      headers: {
        authorization: datas.adminToken,
      },
    })
  }
  server.done()
})

/**
 * Connect Admin
 */
it('Login - Login admin', async () => {
  const email = USER_ADMIN_EMAIL
  const password = USER_ADMIN_PASSWORD
  // Connexion de l'admin
  const response = await onLoginAdminApi({
    email: email,
    password: password,
  })
  // Récupération du token associé et de l'id, pour identifier l'utilisateur
  if (response.status === 201) {
    datas.adminToken = response.data.token
    datas.adminId = response.data.user.id
  }

  assert.strictEqual(response.status, 201)
})

// On donne tous les accès à l'administrateur
it('Give all accesses to Admin', async () => {
  // Extract all access IDs from the nested structure
  const accessIds = accessList.flatMap((elem) => {
    return elem.access.map(a => a.id)
  })
  // Add category access (Magistrat, Greffier, Contractuel)
  accessIds.push(8, 9, 10)

  // Fetch all backups to find the test backup by label
  console.log('[TEST SETUP] Fetching all backups...')
  const allBackupsResponse = await onGetAllBackupsApi({ userToken: datas.adminToken })
  console.log('[TEST SETUP] Backup API response status:', allBackupsResponse.status)
  console.log('[TEST SETUP] Backup API response data:', JSON.stringify(allBackupsResponse.data, null, 2))

  // Handle different response structures
  // API returns: {user: {...}, data: [backups array], date: timestamp}
  const allBackups = Array.isArray(allBackupsResponse.data?.data)
    ? allBackupsResponse.data.data
    : (Array.isArray(allBackupsResponse.data) ? allBackupsResponse.data : [])
  console.log('[TEST SETUP] Parsed backups array length:', allBackups.length)
  console.log('[TEST SETUP] First backup sample:', allBackups[0] ? JSON.stringify(allBackups[0]) : 'none')

  if (!Array.isArray(allBackups) || allBackups.length === 0) {
    throw new Error(`No backups found in database. Response: ${JSON.stringify(allBackupsResponse.data)}`)
  }

  const testBackup = allBackups.find(backup => backup.label === JURIDICTION_TEST_NAME)

  if (!testBackup) {
    const availableLabels = allBackups.map(b => b.label || b.name || 'unlabeled').join(', ')
    throw new Error(`Test backup with label "${JURIDICTION_TEST_NAME}" not found in database. Available backups (${allBackups.length}): ${availableLabels}`)
  }

  const testBackupId = testBackup.id
  console.log(`[TEST SETUP] Found test backup: id=${testBackupId}, label="${testBackup.label}"`)

  // Assign admin to the test backup
  await onUpdateAccountApi({
    userToken: datas.adminToken,
    userId: datas.adminId,
    accessIds: accessIds,
    ventilations: [testBackupId],
    referentielIds: null, // null = access to all referentiels
  })

  console.log('[TEST SETUP] Fetching user data after assignment...')
  const response = await onGetUserDataApi({ userToken: datas.adminToken })
  console.log('[TEST SETUP] User data response:', JSON.stringify(response.data, null, 2))

  datas.adminAccess = response.data.user.access
  datas.adminBackups = response.data.data.backups || []
  datas.adminReferentielIds = response.data.user.referentiel_ids

  console.log('[TEST SETUP] Admin backups after assignment:', JSON.stringify(datas.adminBackups, null, 2))
  console.log('[TEST SETUP] Number of backups assigned:', datas.adminBackups.length)

  // Dynamically lookup backup ID by label (should now succeed)
  datas.adminBackupId = getBackupIdByLabel(JURIDICTION_TEST_NAME)

  if (!datas.adminBackupId) {
    throw new Error(`Failed to find backup ID after assignment. Expected label: "${JURIDICTION_TEST_NAME}", adminBackups: ${JSON.stringify(datas.adminBackups)}`)
  }

  console.log(`[TEST SETUP] Admin assigned to backup: id=${datas.adminBackupId}, backups count=${datas.adminBackups.length}`)
  console.log('[TEST SETUP] Test setup complete')

  // Validate that the backup was found and assigned
  assert.isNotNull(datas.adminBackupId, `Backup with label "${JURIDICTION_TEST_NAME}" must exist in test database`)
  assert.isNotEmpty(datas.adminBackups, 'Admin must have at least one backup assigned')
  assert.strictEqual(response.status, 200)
})

routeUser(datas)
routeChangeUserData(datas)
routeCalcultator(datas)

//routeSimulator(datas)

routeVentilateur(datas)
routePanorama(datas)
routeActivities(datas)

/*routeImport()
routeHR()
routeActivities()
RouteContentieuxOptions()*/
