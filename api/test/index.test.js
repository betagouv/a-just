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

console.warn = () => { }
console.error = () => { }

/*import routeConnexion from './api/RouteConnexion'
import routeImport from './api/RouteImports.test'
import routeHR from './api/RouteHR.test'
import routeActivities from './api/RouteActivities.test'
import RouteContentieuxOptions from './api/RouteContentieuxOptions.test'*/
import config from 'config'
import { onLoginAdminApi, onUpdateAccountApi, onGetUserDataApi } from './routes/user'

const datas = {
  adminId: null,
  adminToken: null,
  userId: null,
  userToken: null,
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

before((done) => {
  console.log('BEFORE WAITING SERVER')
  server.isReady = function () {
    console.log('config', config)

    done()
  }
})

beforeEach(function () {
  // Attach A-JUST context to current test for Mochawesome reporting
  if (datas.adminId && datas.adminToken) {
    const ctx = buildAJustContext()
    this.test.ajustContext = JSON.stringify(ctx)
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
  
  await onUpdateAccountApi({
    userToken: datas.adminToken,
    userId: datas.adminId,
    accessIds: accessIds,
    ventilations: [],
    referentielIds: null, // null = access to all referentiels
  })
  const response = await onGetUserDataApi({ userToken: datas.adminToken })
  datas.adminAccess = response.data.user.access
  datas.adminBackups = response.data.data.backups || []
  datas.adminBackupId = datas.adminBackups.length > 0 ? datas.adminBackups[0].id : null
  datas.adminReferentielIds = response.data.user.referentiel_ids
  assert.strictEqual(response.status, 200)
  assert.isNotEmpty(datas.adminAccess)
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
