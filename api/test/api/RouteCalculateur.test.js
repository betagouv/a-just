import { assert } from 'chai'
import { accessList } from '../../src/constants/access'
import { USER_ADMIN_EMAIl, USER_ADMIN_PASSWORD } from '../constants/admin'
import { USER_TEST_EMAIL, USER_TEST_FIRSTNAME, USER_TEST_FONCTION, USER_TEST_LASTNAME, USER_TEST_PASSWORD } from '../constants/user'
import { onGetUserDataApi, onLoginAdminApi, onLoginApi, onRemoveAccountApi, onSignUpApi, onUpdateAccountApi } from '../routes/user'
import { OnGetBackupListHrApi } from '../routes/hr'
import { OnGetLastMonth } from '../routes/activities'
import { OnFilterList } from '../routes/calculator'

module.exports = function () {
  //let data = null
  let backups = null
  let adminToken = null
  let userToken = null
  let userId = null
  let lastMonth = null

  describe('Check calcul ', () => {
    it('Login - Login admin', async () => {
      // Connexion de l'admin
      const response = await onLoginAdminApi({
        email: USER_ADMIN_EMAIl,
        password: USER_ADMIN_PASSWORD,
      })
      // Récupération du token associé pour l'identifier
      adminToken = response.data.token
      assert.strictEqual(response.status, 201)
    })

    it('Sign up - Create test user', async () => {
      const response = await onSignUpApi({
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        fonction: USER_TEST_FONCTION,
        tj: 'ESSAI',
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
      let response = await OnGetBackupListHrApi({
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

    it('Get my datas as a connected user. Should return 200', async () => {
      const response = await onGetUserDataApi({
        userToken: userToken,
      })
      assert.strictEqual(response.status, 200)
    })

    it('Get last month', async () => {
      //get last month data for specific jurisdiction
      let response = await OnGetLastMonth({
        userToken: adminToken,
        hrBackupId: backups[0].id,
      })
      lastMonth = response.data.date
      assert.strictEqual(response.status, 200)
    })

    it('Catch data', async () => {
      const dateStop = new Date(lastMonth)
      const dateStart = new Date(new Date(dateStop).setDate(dateStop.getDate() - 30))
      const categorySelected = 'magistrats'
      const contentieuxIds = [447, 440, 460, 451, 467, 471, 486, 475, 480, 485, 497]

      const response = await OnFilterList({
        userToken: userToken,
        backupId: backups[0].id,
        dateStart,
        dateStop,
        contentieuxIds,
        optionBackupId: null,
        categorySelected,
        selectedFonctionsIds: null,
      })
      console.log('Reponse catch data:', response.data.data.list[0].childrens[0])
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
