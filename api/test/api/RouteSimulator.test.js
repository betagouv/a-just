import axios from 'axios'
import config from 'config'
//import FormData from 'form-data'
//import { createReadStream } from 'fs'
import { USER_ADMIN_EMAIL, USER_ADMIN_PASSWORD } from '../constants/admin'
import { onGetSituationApi, onGetMonthActivityApi } from '../routes/simulator'
import { SOCIAL_LITIGATION_ID } from '../constants/juridiction'
import { onGetLastMonthApi } from '../routes/activities'
import { onFilterListHRApi } from '../routes/hr'
import { groupBy, map, meanBy, orderBy, sortBy, sumBy } from 'lodash'

module.exports = function (datas) {
  let simulatorData = null

  describe('Simulator page - Check calcul', () => {
    it('Catch data', async () => {
      let backupId = datas.adminBackupId
      let categoryId = 1
      let functionIds = [22, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 38, 39, 36, 56, 35, 57]
      let referentielId = [SOCIAL_LITIGATION_ID]

      const response = await onGetSituationApi({
        userToken: datas.adminToken,
        backupId,
        categoryId,
        functionIds,
        referentielId,
      })
      simulatorData = response.data.data
      assert.strictEqual(response.status, 200)
    })

    it('Check Average monthly inputs', async () => {
      // Get last month on which we have data
      let response = await onGetLastMonthApi({ userToken: datas.adminToken, hrBackupId: datas.adminBackupId })
      let lastMonth = response.data.data.date
      const date = new Date(lastMonth)

      // Get the last 12 months data
      let month = date.getMonth()
      let year = date.getFullYear()
      let day = date.getDay()

      let hrBackupId = datas.adminBackupId
      let monthsData = []
      for (let i = 0; i < 12; i++) {
        if (month === 0) {
          month = 12
          year -= 1
        }
        const now = new Date(year, month, day)

        response = await onGetMonthActivityApi({
          userToken: datas.adminToken,
          hrBackupId,
          date: now,
        })
        const data = response.data.data.list.filter((elem) => elem.contentieux.id === SOCIAL_LITIGATION_ID)
        data.map((elem) => {
          let obj = {
            ...elem,
            entrees: elem.entrees !== null ? elem.entrees : elem.originalEntrees,
          }
          monthsData.push(obj)
        })
        month--
      }
      let totalIn = meanBy(monthsData, 'entrees') || 0
      assert.strictEqual(totalIn, simulatorData.situation.totalIn)
    })

    /*it('Check Observed average time per file', async () => {
      // Get last month on which we have data
      const userToken = datas.adminToken
      const hrBackupId = JURIDICTION_BACKUP_ID
      const contentieuxIds = [SOCIAL_LITIGATION_ID]

      let response = await onGetLastMonthApi({ userToken, hrBackupId })
      let lastMonth = response.data.data.date
      const date = new Date(lastMonth)
      const etpMag = simulatorData.situation.etpMag
      const nbDaysByMagistrat = config.nbDaysByMagistrat
      const nbHoursPerDayAndMagistrat = config.nbHoursPerDayAndMagistrat

      // Get the last 12 months data
      let month = date.getMonth()
      let year = date.getFullYear()
      let day = date.getDay()

      let monthsData = []
      for (let i = 0; i < 12; i++) {
        if (month === 0) {
          month = 12
          year -= 1
        }
        const now = new Date(year, month, day)

        response = await onGetMonthActivityApi({
          userToken: datas.adminToken,
          hrBackupId,
          date: now,
        })
        const data = response.data.data.list.filter((elem) => elem.contentieux.id === SOCIAL_LITIGATION_ID)
        data.map((elem) => {
          console.log('[RouteSimulator.test.js] elem:', elem)
          let obj = {
            ...elem,
            sorties: elem.sorties !== null ? elem.sorties : elem.originalSorties,
          }
          console.log('[RouteSimulator.test.js] Obj:', obj)
          monthsData.push(obj)
        })
        month--
      }
      let totalOut = meanBy(monthsData, 'sorties') || 0

      // Get ETP for the last 12 months
      // let totalEtpMag = null
      // const dateStop = date
      // console.log('[RouteSimulator.test.js][line 122] dateStop:', dateStop)
      // const dateStart = new Date(dateStop) //.setDate(1).setMonth(new Date(dateStop).getMonth() - 12))
      // dateStart.setMonth(date.getMonth() - 11)
      // console.log('[RouteSimulator.test.js][line 123] dateStart', dateStart)

      // const HR = await onFilterListHRApi({ userToken, backupId: hrBackupId, contentieuxIds, date: dateStart })
      // const filteredHr = HR.data.data.list[0].hr.filter((elem) => {
      //   return new Date(elem.currentSituation.dateStart).getTime() <= new Date(dateStart).getTime()
      // })
      // filteredHr.map((elem) => {
      //   let socialActivity = elem.currentActivities.filter((elem) => elem.contentieux.id === SOCIAL_LITIGATION_ID)
      //   if (!elem.hasIndisponibility) totalEtpMag += (socialActivity[0].percent * elem.etp) / 100
      // })

      console.log('[RouteSimulator.test.js][line 113] nbDaysByMagistrat:', nbDaysByMagistrat)
      console.log('[RouteSimulator.test.js][line 114] nbHoursPerDayAndMagistrat:', nbHoursPerDayAndMagistrat)
      console.log('[RouteSimulator.test.js][line 115] etpMag:', etpMag)
      console.log('[RouteSimulator.test.js][line 115] totaleEtpMag:', totalEtpMag)
      console.log('[RouteSimulator.test.js][line 116] totalOut:', totalOut)
      let tmd = (etpMag * nbDaysByMagistrat * nbHoursPerDayAndMagistrat) / (12 * totalOut)
      console.log('[RouteSimulator.test.js][line 118] tmd:', tmd)
      console.log('[RouteSimulator.test.js][line 119] simulatorData: ', simulatorData.situation)
0
      assert.strictEqual(totalOut, simulatorData.situation.totalOut)
    })*/
  })
}
