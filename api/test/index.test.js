import { default as server } from '../src/index'
import { accessList } from '../src/constants/access'
import routeUser from './api/RouteUser.test'
import routeChangeUserData from './api/RouteChangeUserData.test'
import routeCalcultator from './api/RouteCalculator.test'
//import routeSimulator from './api/RouteSimulator.test'
import routeVentilateur from './api/RouteVentilateur.test'
import routePanorama from './api/RoutePanorama.test'
import routeActivities from './api/RouteActivities.test'

import axios from 'axios'
import { assert } from 'chai'

console.warn = () => { }
console.error = () => { }

/*import routeConnexion from './api/RouteConnexion'
import routeImport from './api/RouteImports.test'
import routeHR from './api/RouteHR.test'
import routeActivities from './api/RouteActivities.test'
import RouteContentieuxOptions from './api/RouteContentieuxOptions.test'*/
import config from 'config'
import { USER_ADMIN_EMAIL, USER_ADMIN_PASSWORD } from './constants/admin'
import { onLoginAdminApi, onUpdateAccountApi, onGetUserDataApi } from './routes/user'

const datas = {
  adminToken: null,
  adminAccess: null,
  userId: null,
  userToken: null,
}

describe('Test server is ready', () => {
  before((done) => {
    console.log('BEFORE WAITING SERVER')
    server.isReady = function () {
      console.log('config', config)

      done()
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
    // Récupération du token associé pour l'identifier
    datas.adminToken = response.status === 201 && response.data.token
    datas.adminId = response.status === 201 && response.data.user.id

    assert.strictEqual(response.status, 201)
  })

  // On donne tous les accès à l'administrateur
  it('Give all accesses to Admin', async () => {
    const accessIds = accessList.map((elem) => {
      return elem.id
    })
    await onUpdateAccountApi({
      userToken: datas.adminToken,
      userId: datas.adminId,
      accessIds: accessIds,
      ventilations: [],
    })
    let response = await onGetUserDataApi({ userToken: datas.adminToken })
    datas.adminAccess = response.data.user.access
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
})
