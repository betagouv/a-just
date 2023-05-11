import { assert } from 'chai'
import { accessList } from '../../src/constants/access'
import { USER_ADMIN_EMAIl, USER_ADMIN_PASSWORD } from '../constants/admin'
import { USER_TEST_EMAIL, USER_TEST_PASSWORD, USER_TEST_FIRSTNAME, USER_TEST_LASTNAME, USER_TEST_FONCTION } from '../constants/user'
import { onGetContentiousApi } from '../routes/ventilateur'
import { onLoginAdminApi, onSignUpApi, onLoginApi, onUpdateAccountApi, onRemoveAccountApi, onGetUserDataApi } from '../routes/user'
import { onGetBackupListHrApi } from '../routes/hr'
import { onFilterListApi } from '../routes/humanRessources'

module.exports = function () {
  let backups = null
  let adminToken = null
  let userToken = null
  let userId = null

  describe('Check calcul -- Ventilateur ', () => {
    it('Login - Login admin', async () => {
      // Connexion de l'admin
      const response = await onLoginAdminApi({
        email: USER_ADMIN_EMAIl,
        password: USER_ADMIN_PASSWORD,
      })
      // Récupération du token associé pour l'identifier
      adminToken = response.data && response.data.token
      assert.strictEqual(response.status, 201)
    })

    it('Sign up - Create test user', async () => {
      const response = await onSignUpApi({
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        fonction: USER_TEST_FONCTION,
      })
      assert.strictEqual(response.status, 200)
    })

    it('Login - Log user', async () => {
      const response = await onLoginApi({
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
      })
      userToken = response.status === 201 && response.data.token
      userId = response.data.user.id

      assert.isOk(userToken, 'response 201 and user token created')
    })

    it('Give user accesses and add user to a tj by Admin', async () => {
      let response = await onGetBackupListHrApi({
        userToken: adminToken,
      })
      backups = response.data.data
      const accessIds = accessList.map((elem) => {
        return elem.id
      })

      response = await onUpdateAccountApi({
        userToken: adminToken,
        userId: userId,
        accessIds: accessIds,
        ventilations: [backups[0].id],
      })

      assert.strictEqual(response.status, 200)
    })

    it('Check calcul ETP affected to each contentious', async () => {
      //Catch contentious
      let response = await onGetContentiousApi({ userToken: adminToken, backupId: 12 })
      //console.log('----- ok00')
      const tmp = await onFilterListApi({ userToken: userToken, backupId: 12 })
      console.log('----- Response Global:', tmp.data.data.list[0].hr[0].referentiel[0])
      console.log('----- Response list:', tmp.data.data.list[0].hr[0].currentActivities)
      console.log('----- Response allPersons:', tmp.data.data.list[0].hr[0].currentSituation.etp)
      assert.strictEqual(response.status, 200)

      //response = await onFilterListApi({ userToken: userToken, backupId: 20 })
      //console.log('----- ok01')
      //console.log('----- Response:', response)
    })

    it('Remove user Account by admin', async () => {
      // ⚠️ This route must not be used in code production ! The equivalent route for production is '/users/remove-account/:id'
      const response = await onRemoveAccountApi({
        userId: userId,
        userToken: adminToken,
      })

      assert.strictEqual(response.status, 200)
    })
  })
}
