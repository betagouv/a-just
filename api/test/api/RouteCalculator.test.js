import { onUpdateAccountApi } from '../routes/user'
import { onGetLastMonthApi } from '../routes/activities'
import { onFilterListCalculatorApi } from '../routes/calculator'
import { onFilterListHRApi } from '../routes/hr'
import { JURIDICTION_BACKUP_ID, JURIDICTION_OPTION_BACKUP_ID, SOCIAL_LITIGATION_ID } from '../constants/juridiction'
import { MAGISTART_ID, GREFFIER_ID, EAM_ID } from '../constants/hrCategories'
import { roundFloat } from '../utils/math'
import config from 'config'
import { assert } from 'chai'

module.exports = function (datas) {
  let lastMonth = null
  let calculatorData = null
  let dateStop = null
  let dateStart = null

  // Le backupId est ici prédéfini pour baser les tests sur une juridiction pour laquelle on est sûr d'avoir des données
  describe('Calculator Page - Check calcul ', () => {
    /**
     * Ajout de l'admin sur un TJ pour qu'il puisse accéder, modifier des données du TJ
     */
    it('Add admin to a tj', async () => {
      const response = await onUpdateAccountApi({
        userToken: datas.adminToken,
        userId: datas.adminId,
        accessIds: datas.adminAccess,
        ventilations: [JURIDICTION_BACKUP_ID],
      })

      assert.strictEqual(response.status, 200)
    })

    /**
     * Obtention du dernier mois pour lequel le TJ a des données d'activités
     */
    it('Get last month', async () => {
      //Récupération du dernier mois pour lequel on a des données d'activités
      let response = await onGetLastMonthApi({
        userToken: datas.adminToken,
        hrBackupId: JURIDICTION_BACKUP_ID,
      })
      lastMonth = response.data.data.date
      assert.strictEqual(response.status, 200)
    })

    /**
     * Récupération des données du Calculateur pour le TJ tel que: les entrées, le sorties, les stocks, etp (Siège, Greffier, EAM), DTES (Délai Théorique d’Écoulement du Stock), Taux de couverture .... 
     */
    it('Catch data', async () => {
      dateStart = new Date(lastMonth)
      dateStop = new Date(dateStart.getFullYear(), dateStart.getMonth() + 1, 0)

      const categorySelected = 'magistrats'
      const contentieuxIds = [SOCIAL_LITIGATION_ID]
      const backupId = JURIDICTION_BACKUP_ID
      const optionBackupId = JURIDICTION_OPTION_BACKUP_ID
      
      const response = await onFilterListCalculatorApi({
        userToken: datas.adminToken,
        backupId,
        dateStart,
        dateStop,
        contentieuxIds,
        optionBackupId,
        categorySelected,
        selectedFonctionsIds: null,
      })
      calculatorData = response.data.data.list[0]

      assert.strictEqual(response.status, 200)
      assert.isNotEmpty(calculatorData)
    })

    /**
     * Vérification du calcul sur l'ETP du siège (calcul à revoir)
     */
    it('Check ETPT Siege', async () => {
      // Retrieving all the HR 'Siege' from a specific jurisdiction who are assigned exclusively to the Social litigation department
      // console.log('backupId', JURIDICTION_BACKUP_ID)
      // console.log('SOCIAL_LITIGATION_ID', SOCIAL_LITIGATION_ID)
      // console.log('MAGISTART_ID', MAGISTART_ID)
      // console.log('GREFFIER_ID', GREFFIER_ID)
      // console.log('dataEtpMag', calculatorData.etpMag)
      // console.log('EAM_ID', EAM_ID)

      // const userToken = datas.adminToken
      // const backupId = JURIDICTION_BACKUP_ID
      // const contentieuxIds = [SOCIAL_LITIGATION_ID]
      // const categoriesIds = [MAGISTART_ID, GREFFIER_ID, EAM_ID]
      // const dataEtptMag = Number.parseFloat(calculatorData.etpMag).toFixed(2)
      // let totalEtpMag = null

      // const HR = await onFilterListHRApi({ userToken, backupId, contentieuxIds, categoriesIds, date: dateStart })
      // const filteredHr = HR.data.data.list[0].hr.filter((elem) => {
      //   return new Date(elem.currentSituation.dateStart).getTime() <= new Date(dateStart).getTime()
      // })
      // filteredHr.map((elem) => {
      //   let socialActivity = elem.currentActivities.filter((elem) => elem.contentieux.id === SOCIAL_LITIGATION_ID)
      //   if (!elem.hasIndisponibility) {
      //     totalEtpMag += (socialActivity[0].percent * elem.etp) / 100
      //   }
      // })
      // totalEtpMag = Number.parseFloat(totalEtpMag).toFixed(2)

      // assert.strictEqual(HR.status, 200)
      // assert.strictEqual(totalEtpMag, dataEtptMag)
    })

    /**
     * Vérification du calcul sur le taux de couverture constaté (calcul à revoir)
     */
    it('Check Obeserved Coverage Rate', () => {
      // if (calculatorData.totalOut && calculatorData.totalIn && calculatorData.realCoverage) {
      //   const totalOut = calculatorData.totalOut
      //   const totalIn = calculatorData.totalIn

      //   const tmp = totalOut / totalIn
      //   const res = roundFloat(tmp, 2)

      //   assert.strictEqual(res, calculatorData.realCoverage)
      // } else {
      //   assert.fail()
      // }
    })

    /**
     * Vérification du calcul du DTES instantané (calcul à revoir)
     */
    it('Theoretical instantaneous stock flow time', () => {
      // console.log('calculatorData', calculatorData.totalOut, calculatorData.lastStock, calculatorData.realDTESInMonths)
      // if (calculatorData.totalOut && calculatorData.lastStock && calculatorData.realDTESInMonths) {
      //   const totalOut = calculatorData.totalOut
      //   const totalStock = calculatorData.lastStock

      //   const tmp = totalStock / totalOut
      //   const res = roundFloat(tmp, 2)
      //   console.log('tmp', tmp)
      //   console.log('res', res)
      //   console.log('realDTESInMonths', calculatorData.realDTESInMonths)
      //   assert.strictEqual(res, calculatorData.realDTESInMonths)
      // } else {
      //   assert.fail()
      // }
    })

    /**
     * Vérification du calcul du temps moyen par dossier (calcul à revoir)
     */
    it('Observed average time per file', () => {
      // console.log('totalOut', calculatorData.totalOut)
      // console.log('etpMag', calculatorData.etpMag)
      // console.log('magRealTimePerCase', calculatorData.magRealTimePerCase)
      // if (calculatorData.totalOut && calculatorData.etpMag && calculatorData.magRealTimePerCase) {
      //   const totalOut = calculatorData.totalOut
      //   const etpMag = calculatorData.etpMag
      //   const nbDaysByMagistrat = config.nbDaysByMagistrat
      //   const nbHoursPerDayAndMagistrat = config.nbHoursPerDayAndMagistrat
      //   const tmp = (nbDaysByMagistrat * nbHoursPerDayAndMagistrat * etpMag) / (12 * totalOut)
      //   const res = roundFloat(tmp, 3)

      //   console.log('res', res)
      //   console.log('magRealTimePerCase', calculatorData.magRealTimePerCase)
      //   assert.strictEqual(res, calculatorData.magRealTimePerCase)
      // } else {
      //   assert.fail()
      // }
    })

    /**
     * Vérification du calcul du nombre possible de sorties de dossiers du siège. (calcul à revoir)
     */
    it('Possible folders out Siege', () => {
      // console.log('calculatorData', calculatorData)
      // console.log('etpMag', calculatorData.etpMag)
      // console.log('magCalculateTimePerCase', calculatorData.magCalculateTimePerCase)
      // console.log('magCalculateOut', calculatorData.magCalculateOut)
      // if (calculatorData.etpMag && calculatorData.magCalculateTimePerCase && calculatorData.magCalculateOut) {
      //   const magEtpAffected = calculatorData.etpMag
      //   const magCalculateTimePerCase = calculatorData.magCalculateTimePerCase
      //   const nbDaysByMagistrat = config.nbDaysByMagistrat
      //   const nbHoursPerDayAndMagistrat = config.nbHoursPerDayAndMagistrat

      //   const res = Math.floor(Math.floor((magEtpAffected * nbHoursPerDayAndMagistrat * nbDaysByMagistrat) / 12) / magCalculateTimePerCase)

      //   console.log('res', res)
      //   console.log('magCalculateOut', calculatorData.magCalculateOut)
      //   assert.strictEqual(res, calculatorData.magCalculateOut)
      // } else {
      //   assert.fail()
      // }
    })

    /**
     * Vérification du calcul du DTES calculé (calcul à revoir)
     */
    it('Theoretical calculated stock flow time', () => {
      // console.log('magCalculateOut', calculatorData.magCalculateOut)
      // console.log('lastStock', calculatorData.lastStock)
      // console.log('magCalculateDTESInMonths', calculatorData.magCalculateDTESInMonths)
      // if (calculatorData.magCalculateOut && calculatorData.lastStock && calculatorData.magCalculateDTESInMonths) {
      //   const totalOut = calculatorData.magCalculateOut
      //   const totalStock = calculatorData.lastStock

      //   const tmp = totalStock / totalOut
      //   const res = roundFloat(tmp, 2)
      //   assert.strictEqual(res, calculatorData.magCalculateDTESInMonths)
      // } else {
      //   assert.fail()
      // }
    })

    /**
     * Vérification du calcul sur le taux de couverture calculé (calcul à revoir)
     */
    it('Theoretical calculated coverage rate', () => {
    //   console.log('magCalculateOut', calculatorData.magCalculateOut)
    //   console.log('totalIn', calculatorData.totalIn)
    //   console.log('magCalculateCoverage', calculatorData.magCalculateCoverage)
    //   if (calculatorData.magCalculateOut && calculatorData.totalIn && calculatorData.magCalculateCoverage) {
    //     const totalOut = calculatorData.magCalculateOut
    //     const totalIn = calculatorData.totalIn

    //     const tmp = totalOut / totalIn
    //     const res = roundFloat(tmp, 3)
    //     assert.strictEqual(res, calculatorData.magCalculateCoverage)
    //   } else {
    //     assert.fail()
    //   }
    })
  })
}
