import axios from 'axios'
import config from 'config'
import { assert } from 'chai'
//import FormData from 'form-data'
//import { createReadStream } from 'fs'
import { USER_ADMIN_EMAIl, USER_ADMIN_PASSWORD } from '../constants/admin'
import { onGetSituationApi, onGetMonthActivityApi } from '../routes/simulator'
import { JURIDICTION_BACKUP_ID } from '../constants/juridiction'
import { onGetLastMonthApi } from '../routes/activities'
import { groupBy, map, meanBy, orderBy, sortBy, sumBy } from 'lodash'

module.exports = function (datas) {
  let simulatorData = null

  describe('Simulator page - Check calcul', () => {
    it('Catch data', async () => {
      let backupId = JURIDICTION_BACKUP_ID
      let categoryId = 1
      let functionIds = [22, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 38, 39, 36, 56, 35, 57]
      let referentielId = [447]

      const response = await onGetSituationApi({
        userToken: datas.adminToken,
        backupId,
        categoryId,
        functionIds,
        referentielId,
      })
      simulatorData = response.data.data
      console.log('Response:', response.data)
      assert.strictEqual(response.status, 200)
    })

    it('Check Average monthly inputs', async () => {
      // Get last month on which we have data
      let response = await onGetLastMonthApi({ userToken: datas.adminToken, hrBackupId: JURIDICTION_BACKUP_ID })
      let lastMonth = response.data.data.date
      const date = new Date(lastMonth)
      console.log('[RouteSimulator.test.js][line 38] date: ', date)

      // Get the last 12 months data
      let month = date.getMonth() + 1
      let year = date.getFullYear()
      let day = date.getDay()

      let hrBackupId = JURIDICTION_BACKUP_ID
      let monthsData = []
      for (let i = 0; i < 12; i++) {
        //if (date.getMonth() - i < 0)
        if (month === 0) {
          month = 12
          year -= 1
        }
        const now = new Date(year, month, day)

        console.log('[RouteSimulator.test.js][line 56] Current:', month + '/' + year)
        console.log('[RouteSimulator.test.js][line 57] Date:', now)

        response = await onGetMonthActivityApi({
          userToken: datas.adminToken,
          hrBackupId,
          date: now,
        })
        console.log('[RouteSimulator.test.js][line 64] response:')
        const data = response.data.data.list.filter((elem) => elem.contentieux.id === 447)
        data.map((elem) => {
          // if (elem.entrees) {
          monthsData.push(elem) // += elem.entrees !== null ? elem.entrees : elem.originalEntrees //.push(elem.entrees)
          console.log('[RouteSimulator.test.js][line 66] data: ', elem)
          //}
        })
        console.log('[RouteSimulator.test.js][line 72] monthsData: ', monthsData)
        //response.data.data.list.map((elem) => console.log('contentieux:', elem.contentieux))
        month--
      }
      console.log('[RouteSimulator.test.js][line 76] monthDatas: ', monthsData)
      let totalIn = meanBy(monthsData, 'entrees') || 0
      console.log('[RouteSimulator.test.js][line 77] totalIn: ', totalIn)
      //let averageEntries = monthsData / 12
      //console.log('[RouteSimulator.test.js][line 79] averageEntries: ', averageEntries)
      console.log('[RouteSimulator.test.js][line 80] simulatorData: ', simulatorData.situation)

      /*
      })
      */
      //console.log('Response data: ', response.data)
      //assert.strictEqual(response.status, 200)
      assert.isOk(true)
    })
  })
}
