import { onGetLastMonthApi, onGetDataByMonthApi } from '../routes/activities'
import { onGetAllContentieuxReferentiels } from '../routes/contentieux'
import { JURIDICTION_DATA_BACKUP_ID } from '../constants/juridiction'
import { assert } from 'chai'

module.exports = function (datas) {
  let activities = []
  let referentiels = []
  let lastMonthActivity = null

  describe('Test Activities', () => {
    it('load Referentiel', async () => {
      const response = await onGetAllContentieuxReferentiels({ userToken: datas.adminToken, jirs: true})

      referentiels = response.data && response.data.data
      assert.isOk(referentiels.length !== 0, 'missing contentieux referentiels')
    })

    it('Get last month activity fron a TJ', async () => {
      const response = await onGetLastMonthApi({ userToken: datas.adminToken, hrBackupId: JURIDICTION_DATA_BACKUP_ID })
      if (response.data && response.data.data && response.data.data.date)
        lastMonthActivity = response.data.data.date
      assert.strictEqual(response.status, 200)
    })

    it('Get last data available from a TJ', async () => {
      const response = await onGetDataByMonthApi({ userToken: datas.adminToken, hrBackupId: JURIDICTION_DATA_BACKUP_ID, date: lastMonthActivity })
      let data = null
      let isEmptyIn = true
      let isEmptyOut = true
      let isEmptyStock = true
      
      if (response && response.data && response.data.data && response.data.data.list) {
        data = response.data.data.list
        data.map(elem => {
          if(elem.originalEntrees !== null)
            isEmptyIn = false
          if(elem.originalSorties !== null)
            isEmptyOut = false
          if(elem.originalStock !== null)
            isEmptyStock = false
        })
      }
      assert.strictEqual(response.status, 200)
      assert.isFalse(isEmptyIn && isEmptyOut && isEmptyStock);
    })
  
    /*it('load Activities', async () => {
      const response = await axios.post(
        `${config.serverUrl}/activities/get-all`,
        {
          backupId: null,
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )

      activities = response.data && response.data.data && response.data.data.activities
      backupId = response.data && response.data.data && response.data.data.backupId
      assert.isOk(activities.length === 0, 'activities whas imported')
    })

    it('add Acitivity', async () => {
      const response = await axios.post(
        `${config.serverUrl}/activities/save-backup`,
        {
          list: [
            {
              periode: new Date(),
              entrees: 10,
              sorties: 20,
              stock: 30,
              contentieux: referentiels[0],
            },
          ],
          backupId,
          backupName: 'test copy',
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )
      assert.equal(response.status, 200, 'save Activities fail')
      backupId = response.data && response.data.data
    })

    it('load current activities', async () => {
      const response = await axios.post(
        `${config.serverUrl}/activities/get-all`,
        {
          backupId,
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )

      activities = response.data && response.data.data && response.data.data.activities
      backupId = response.data && response.data.data && response.data.data.backupId
      console.log('Activities:', activities)
      assert.isOk(activities.length === 1, 'activities not loaded')
    })

    it('delete Copy', async () => {
      const response = await axios.delete(`${config.serverUrl}/activities/remove-backup/${backupId}`, {
        headers: {
          Authorization: userToken,
        },
      })

      assert.equal(response.status, 200, 'delete backup fail')
    })*/
  })
}
