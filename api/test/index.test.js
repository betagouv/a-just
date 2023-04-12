import { default as server } from '../src/index' //'../dist/index'
import routeIndex from './api/Route.test'
import routeUser from './api/RouteUser.test'
import routeChangeUserData from './api/RouteChangeUserData.test'
import routeCalcultator from './api/RouteCalculateur.test'
import axios from 'axios'
import { assert } from 'chai'

/*import routeUnauthorizedAccess from './api/RouteUnauthorizedAccess.test'
import routeConnexion from './api/RouteConnexion'
import routeImport from './api/RouteImports.test'
import routeHR from './api/RouteHR.test'
import routeActivities from './api/RouteActivities.test'
import RouteContentieuxOptions from './api/RouteContentieuxOptions.test'*/
import config from 'config'

describe('Test server is ready', () => {
  before((done) => {
    console.log('BEFORE WAITING SERVER')
    server.isReady = function () {
      console.log('config', config)
      done()
    }
  })

  let adminToken = null
  let userId = null
  let userToken = null
  const userEmail = 'test@mail.com'
  const userPassword = '123456'
  const userFirstname = 'userFirstname'
  const userLastname = 'userLastname'

  /**
   * Connect Admin
   */
  it('Login - Login admin', async () => {
    const email = 'redwane.zafari@a-just.fr'
    const password = '123456'

    // Connexion de l'admin
    const response = await axios.post(`${config.serverUrl}/auths/login-admin`, {
      email,
      password,
    })
    // Récupération du token associé pour l'identifier
    adminToken = response.data.token
    assert.strictEqual(response.status, 201)
  })

  /**
   *  Vérification que l'utilisateur peut bien s'inscrire si toutes les information obligatoires sont corrects
   */
  it('Sign up - Check that a user can signUp if all entered inputs are fullfilled', async () => {
    const response = await axios.post(`${config.serverUrl}/users/create-account`, {
      email: userEmail,
      password: userPassword,
      firstName: userFirstname,
      lastName: userLastname,
      fonction: 'Testeur',
      tj: 'ESSAI',
    })
    assert.strictEqual(response.status, 200)
  })

  /**
   * Vérification que la connexion avec les bonnes infos fonctionne
   */
  it('Login - Login should succeed and return 201 with user token', async () => {
    const email = 'test@mail.com'
    const password = '123456'

    const response = await axios.post(`${config.serverUrl}/auths/login`, {
      email,
      password,
    })
    userToken = response.status === 201 && response.data.token
    userId = response.data.user.id

    assert.isOk(userToken, 'response 201 and user token created')
  })

  console.log('USER_TOKEN_00:', userToken)
  routeIndex()
  routeUser(userToken, adminToken)
  //routeChangeUserData()
  //routeCalcultator()
  /*routeUnauthorizedAccess(),
  routeChangeData(),
  routeImport()
  routeConnexion(),
  /*routeImport()
  routeHR()
  routeActivities()
  RouteContentieuxOptions()*/

  it('Remove user Account by admin', async () => {
    // ⚠️ This route must not be use in code production ! The equivalent route for production is '/users/remove-account/:id'
    const response = await axios.delete(`${config.serverUrl}/users/remove-account-test/${userId}`, {
      headers: {
        authorization: adminToken,
      },
    })

    assert.strictEqual(response.status, 200)
  })

  after(function () {
    server.done()
  })
})
