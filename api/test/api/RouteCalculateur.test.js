import { assert } from 'chai'
import { accessList } from '../../src/constants/access'
import { USER_ADMIN_EMAIl, USER_ADMIN_PASSWORD } from '../constants/admin'
import { USER_TEST_EMAIL, USER_TEST_FIRSTNAME, USER_TEST_FONCTION, USER_TEST_LASTNAME, USER_TEST_PASSWORD } from '../constants/user'
import { onGetUserDataApi, onLoginAdminApi, onLoginApi, onRemoveAccountApi, onSignUpApi, onUpdateAccountApi } from '../routes/user'
import { OnGetBackupListHrApi } from '../routes/hr'
import { OnGetLastMonth } from '../routes/activities'
import { OnFilterList } from '../routes/calculator'

module.exports = function (datas) {
  //let data = null
  let backups = null
  let lastMonth = null

  describe('Check calcul ', () => {
    it('Give user accesses and add user to a tj by Admin', async () => {
      let response = await OnGetBackupListHrApi({
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

    it('Get my datas as a connected user. Should return 200', async () => {
      const response = await onGetUserDataApi({
        userToken: datas.userToken,
      })
      assert.strictEqual(response.status, 200)
    })

    it('Get last month', async () => {
      //get last month data for specific jurisdiction
      let response = await OnGetLastMonth({
        userToken: datas.adminToken,
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
        userToken: datas.userToken,
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
  })
}
