import { default as server } from '../src/index'
import routeUser from './api/RouteUser.test'
import routeChangeUserData from './api/RouteChangeUserData.test'
import routeCalcultator from './api/RouteCalculateur.test'
import routeVentilateur from './api/RouteVentilateur.test'
import axios from 'axios'
import { assert } from 'chai'

console.warn = () => {}
console.error = () => {}

/*import routeConnexion from './api/RouteConnexion'
import routeImport from './api/RouteImports.test'
import routeHR from './api/RouteHR.test'
import routeActivities from './api/RouteActivities.test'
import RouteContentieuxOptions from './api/RouteContentieuxOptions.test'*/
import config from 'config'
import { USER_ADMIN_EMAIl, USER_ADMIN_PASSWORD } from './constants/admin'
import { USER_TEST_EMAIL, USER_TEST_FIRSTNAME, USER_TEST_FONCTION, USER_TEST_LASTNAME, USER_TEST_PASSWORD } from './constants/user'

const datas = {
  adminToken: null,
  userId: null,
  userToken: null,
}

describe('Test server is ready', () => {
  beforeEach(() => {
    //sinon.stub(console, 'error').returns(undefined)
  })
  before((done) => {
    console.log('BEFORE WAITING SERVER')
    server.isReady = function () {
      console.log('config', config)

      done()
    }
  })

  it('Login - Login admin', async () => {
    const email = USER_ADMIN_EMAIl
    const password = USER_ADMIN_PASSWORD

    // Connexion de l'admin
    const response = await axios.post(`${config.serverUrl}/auths/login-admin`, {
      email,
      password,
    })
    console.log(datas)
    // Récupération du token associé pour l'identifier
    datas.adminToken = response.status === 201 && response.data.token
    console.log('adminToken', datas.adminToken)
    assert.strictEqual(response.status, 201)
  })

  /**
   * Connect Admin
   */
  /*it('Login - Login admin', async () => {
    const email = USER_ADMIN_EMAIl
    const password = USER_ADMIN_PASSWORD

    // Connexion de l'admin
    const response = await axios.post(`${config.serverUrl}/auths/login-admin`, {
      email,
      password,
    })
    // Récupération du token associé pour l'identifier
    adminToken = response.status === 201 && response.data.token
    assert.strictEqual(response.status, 201)
  })*/

  /**
   *  Vérification que l'utilisateur peut bien s'inscrire si toutes les information obligatoires sont corrects
   */
  /*it('Sign up - Check that a user can signUp if all entered inputs are fullfilled', async () => {
    const response = await axios.post(`${config.serverUrl}/users/create-account`, {
      email: USER_TEST_EMAIL,
      password: USER_TEST_PASSWORD,
      firstName: USER_TEST_FIRSTNAME,
      lastName: USER_TEST_LASTNAME,
      fonction: USER_TEST_FONCTION,
      tj: 'ESSAI',
    })
    assert.strictEqual(response.status, 200)
  })*/

  /**
   * Vérification que la connexion avec les bonnes infos fonctionne
   */
  /*it('Login - Login should succeed and return 201 with user token', async () => {
    const email = USER_TEST_EMAIL
    const password = USER_TEST_PASSWORD

    const response = await axios.post(`${config.serverUrl}/auths/login`, {
      email,
      password,
    })
    userToken = response.status === 201 && response.data.token
    userId = response.data.user.id
    console.log('USER-TOKEN_00:', userToken)
    console.log('ADMIN-TOKEN_00:', adminToken)

    assert.isOk(userToken, 'response 201 and user token created')
  })*/

  routeUser(datas)
  routeChangeUserData()
  routeCalcultator()
  routeVentilateur()

  // TROUVER UN MOYEN D'ATTENDRE QUE USERTOKEN ET ADMINTOKEN SOIENT SET AVANT DE LANCER LES TESTS SUIVANTS

  /*routeImport()
  routeHR()
  routeActivities()
  RouteContentieuxOptions()*/

  /**
   * Vérification qu'un admin puisse bien surrpimer le compte d'un utilisateur
   */
  /*it('Remove user Account by admin', async () => {
    // ⚠️ This route must not be use in code production ! The equivalent route for production is '/users/remove-account/:id'
    const response = await axios.delete(`${config.serverUrl}/users/remove-account-test/${userId}`, {
      headers: {
        authorization: adminToken,
      },
    })

    assert.strictEqual(response.status, 200)
  })*/

  after(function () {
    server.done()
  })
})
