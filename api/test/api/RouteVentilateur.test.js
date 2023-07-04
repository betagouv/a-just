import { assert } from 'chai'
import { onUpdateAccountApi } from '../routes/user'
import { onFilterListHRApi } from '../routes/hr'
import { JURIDICTION_BACKUP_ID } from '../constants/juridiction'

module.exports = function (datas) {
  describe('Check calcul -- Ventilateur ', () => {
    it('Add admin to a tj', async () => {
      const response = await onUpdateAccountApi({
        userToken: datas.adminToken,
        userId: datas.adminId,
        accessIds: datas.adminAccess,
        ventilations: [JURIDICTION_BACKUP_ID],
      })
      assert.strictEqual(response.status, 200)
    })

    it('Catch data', async () => {
      /*const dateStop = new Date(lastMonth)
      const dateStart = new Date(new Date(dateStop).setDate(1))
      const categorySelected = 'magistrats'*/
      const contentieuxIds = [447]
      let sumEtpSocial = null

      const response = await onFilterListHRApi({
        userToken: datas.adminToken,
        backupId: JURIDICTION_BACKUP_ID,
        /*dateStart,
        dateStop,*/
        contentieuxIds,
        /*optionBackupId: JURIDICTION_OPTION_BACKUP_ID,
        categorySelected,
        selectedFonctionsIds: [22, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 38, 39],*/
      })

      console.log('[RouteVentilateur.test.js][line 66]  Reponse catch data:', response.data.data.list)
      response.data.data.list.map((elem) => {
        // console.log('\n\nListe des ', elem.label, ':')
        elem.hr.map((hr) => {
          if (hr.hasIndisponibility > 0) {
            console.log(
              '\nName:',
              hr.firstName + ' ' + hr.lastName + '\nEtp:',
              hr.etp + '\nCurrent Activities:',
              hr.currentActivities,
              //hr.currentActivities.filter((activite) => activite.contentieux.id === 447),
              '\nIndispo: ' + hr.hasIndisponibility,
              '\nPercent:',
              (hr.currentActivities.filter((activite) => activite.contentieux.id === 447)[0].percent * hr.etp) / 100
            )
            console.log('Indisponibilité:', hr.indisponibilities)
          }

          sumEtpSocial += (hr.currentActivities.filter((activite) => activite.contentieux.id === 447)[0].percent * hr.etp) / 100
        })
      })
      console.log('[RouteVentilateur.test.js][line 66] SumEtpSocial:', sumEtpSocial)
    })
  })
}
