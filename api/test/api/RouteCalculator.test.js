import { onUpdateAccountApi } from '../routes/user'
import { onGetLastMonthApi } from '../routes/activities'
import { onFilterListCalculatorApi } from '../routes/calculator'
import { onFilterListHRApi } from '../routes/hr'
import { JURIDICTION_BACKUP_ID, JURIDICTION_OPTION_BACKUP_ID, SOCIAL_LITIGATION_ID } from '../constants/juridiction'
import { roundFloat } from '../utils/math'
import config from 'config'
import { EAM_ID, GREFFIER_ID, MAGISTART_ID } from '../constants/hrCategories'

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
     * Vérification du calcul sur l'ETP du siège
     */
    it('Check ETPT Siege', async () => {
      // Retrieving all the HR 'Siege' from a specific jurisdiction who are assigned exclusively to the Social litigation department
      let userToken = datas.adminToken
      let backupId = JURIDICTION_BACKUP_ID
      let contentieuxIds = [SOCIAL_LITIGATION_ID]
      let categoriesIds = [MAGISTART_ID, GREFFIER_ID, EAM_ID]
      let totalEtpMag = null

      const HR = await onFilterListHRApi({ userToken, backupId, contentieuxIds, categoriesIds, date: dateStart })
      const filteredHr = HR.data.data.list[0].hr.filter((elem) => {
        return new Date(elem.currentSituation.dateStart).getTime() <= new Date(dateStart).getTime()
      })
      filteredHr.map((elem) => {
        let socialActivity = elem.currentActivities.filter((elem) => elem.contentieux.id === SOCIAL_LITIGATION_ID)
        if (!elem.hasIndisponibility) {
          totalEtpMag += (socialActivity[0].percent * elem.etp) / 100
        }
      })
      assert.strictEqual(HR.status, 200)
      assert.strictEqual(totalEtpMag, calculatorData.etpMag)
    })

    /**
     * Vérification du calcul sur le taux de couverture constaté
     */
    it('Check Obeserved Coverage Rate', () => {
      if (calculatorData.totalOut && calculatorData.totalIn && calculatorData.realCoverage) {
        const totalOut = calculatorData.totalOut
        const totalIn = calculatorData.totalIn

        const tmp = totalOut / totalIn
        const res = roundFloat(tmp, 2)
        assert.strictEqual(res, calculatorData.realCoverage)
      } else {
        assert.fail()
      }
    })

    /**
     * Vérification du calcul du DTES instantané
     */
    it('Theoretical instantaneous stock flow time', () => {
      if (calculatorData.totalOut && calculatorData.lastStock && calculatorData.realDTESInMonths) {
        const totalOut = calculatorData.totalOut
        const totalStock = calculatorData.lastStock

        const tmp = totalStock / totalOut
        const res = roundFloat(tmp, 2)

        assert.strictEqual(res, calculatorData.realDTESInMonths)
      } else {
        assert.fail()
      }
    })

    /**
     * Vérification du calcul du temps moyen par dossier
     */
    it('Observed average time per file', () => {
      if (calculatorData.totalOut && calculatorData.etpMag && calculatorData.magRealTimePerCase) {
        const totalOut = calculatorData.totalOut
        const etpMag = calculatorData.etpMag
        const nbDaysByMagistrat = config.nbDaysByMagistrat
        const nbHoursPerDayAndMagistrat = config.nbHoursPerDayAndMagistrat

        const tmp = (nbDaysByMagistrat * nbHoursPerDayAndMagistrat * etpMag) / (12 * totalOut)
        const res = roundFloat(tmp, 3)
        assert.strictEqual(res, calculatorData.magRealTimePerCase)
      } else {
        assert.fail()
      }
    })

    /**
     * Vérification du calcul du nombre possible de sorties de dossiers du siège.
     */
    it('Possible folders out Siege', () => {
      if (calculatorData.etpMag && calculatorData.magCalculateTimePerCase && calculatorData.magCalculateOut) {
        const magEtpAffected = calculatorData.etpMag
        const magCalculateTimePerCase = calculatorData.magCalculateTimePerCase
        const nbDaysByMagistrat = config.nbDaysByMagistrat
        const nbHoursPerDayAndMagistrat = config.nbHoursPerDayAndMagistrat

        const res = Math.floor(Math.floor((magEtpAffected * nbHoursPerDayAndMagistrat * nbDaysByMagistrat) / 12) / magCalculateTimePerCase)
        assert.strictEqual(res, calculatorData.magCalculateOut)
      } else {
        assert.fail()
      }
    })

    /**
     * Vérification du calcul du DTES calculé
     */
    it('Theoretical calculated stock flow time', () => {
      if (calculatorData.magCalculateOut && calculatorData.lastStock && calculatorData.magCalculateDTESInMonths) {
        const totalOut = calculatorData.magCalculateOut
        const totalStock = calculatorData.lastStock

        const tmp = totalStock / totalOut
        const res = roundFloat(tmp, 2)
        assert.strictEqual(res, calculatorData.magCalculateDTESInMonths)
      } else {
        assert.fail()
      }
    })

    /**
     * Vérification du calcul sur le taux de couverture calculé
     */
    it('Theoretical calculated coverage rate', () => {
      if (calculatorData.magCalculateOut && calculatorData.totalIn && calculatorData.magCalculateCoverage) {
        const totalOut = calculatorData.magCalculateOut
        const totalIn = calculatorData.totalIn

        const tmp = totalOut / totalIn
        const res = roundFloat(tmp, 3)
        assert.strictEqual(res, calculatorData.magCalculateCoverage)
      } else {
        assert.fail()
      }
    })
  })
}
