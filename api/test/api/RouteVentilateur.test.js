import { assert } from 'chai'
import { accessList } from '../../src/constants/access'
import { USER_ADMIN_EMAIl, USER_ADMIN_PASSWORD } from '../constants/admin'
import { USER_TEST_EMAIL, USER_TEST_PASSWORD, USER_TEST_FIRSTNAME, USER_TEST_LASTNAME, USER_TEST_FONCTION } from '../constants/user'
import { onGetContentiousApi } from '../routes/ventilateur'
import { onLoginAdminApi, onSignUpApi, onLoginApi, onUpdateAccountApi, onRemoveAccountApi, onGetUserDataApi } from '../routes/user'
import { onGetBackupListHrApi } from '../routes/hr'
import { onFilterListApi } from '../routes/humanRessources'

module.exports = function (datas) {
  let backups = null

  describe('Check calcul -- Ventilateur ', () => {
    it('Give user accesses and add user to a tj by Admin', async () => {
      let response = await onGetBackupListHrApi({
        userToken: datas.adminToken,
      })
      backups = response.data.data
      const accessIds = accessList.map((elem) => {
        return elem.id
      })

      response = await onUpdateAccountApi({
        userToken: datas.adminToken,
        userId: datas.userId,
        accessIds: accessIds,
        ventilations: [backups[0].id],
      })

      assert.strictEqual(response.status, 200)
    })

    it('Check calcul ETP affected to each contentious', async () => {
      //Catch contentious
      let response = await onGetContentiousApi({ userToken: datas.adminToken, backupId: 12 })
      //console.log('----- ok00')
      const tmp = await onFilterListApi({ userToken: datas.userToken, backupId: 12 })
      console.log('----- Response Global:', tmp.data.data.list[0].hr[0].referentiel[0])
      console.log('----- Response list:', tmp.data.data.list[0].hr[0].currentActivities)
      console.log('----- Response allPersons:', tmp.data.data.list[0].hr[0].currentSituation.etp)
      assert.strictEqual(response.status, 200)

      //response = await onFilterListApi({ userToken: userToken, backupId: 20 })
      //console.log('----- ok01')
      //console.log('----- Response:', response)
    })
  })
}
