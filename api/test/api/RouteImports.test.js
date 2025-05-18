import axios from 'axios'
import config from 'config'
//import FormData from 'form-data'
//import { createReadStream } from 'fs'
import { USER_ADMIN_EMAIL, USER_ADMIN_PASSWORD } from '../constants/admin'

module.exports = function () {
  let userToken = null

  describe('Générate user auth', () => {
    it('has token response code', async () => {
      const response = await axios.post(`${config.serverUrl}/auths/login`, {
        email: USER_ADMIN_EMAIL,
        password: USER_ADMIN_PASSWORD,
      })
      userToken = response.data && response.data.token
      assert.isOk(userToken, 'cannot generate token')
    })
  })

  /*describe('Test import referentiel', () => {
    it('upload referentiel', async () => {
      const formData = new FormData()
      formData.append('file', createReadStream(`${__dirname}/../files/A-JUST_nomenclature.csv`))

      const response = await axios.post(`${config.serverUrl}/imports/import-referentiel`, formData, {
        headers: {
          Authorization: userToken,
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
        },
      })
      assert.equal(response.status, 200, 'import referentiel fail')
    })

    it('load referentiel', async () => {
      const response = await axios.post(`${config.serverUrl}/referentiels/get-referentiels`, {
        headers: {
          Authorization: userToken,
        },
      })
      assert.isOk(response.data && response.data.data.length, 'not referentiel imported')
    })
  })

  describe('Test import HR', () => {
    it('upload HR', async () => {
      const formData = new FormData()
      formData.append('backupName', 'initialisation')
      formData.append('file', createReadStream(`${__dirname}/../files/hr-sample.csv`))

      const response = await axios.post(`${config.serverUrl}/imports/import-hr`, formData, {
        headers: {
          Authorization: userToken,
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
        },
      })
      assert.equal(response.status, 200, 'import HR fail')
    })

    it('load HR', async () => {
      const response = await axios.post(
        `${config.serverUrl}/human-resources/get-current-hr`,
        {
          backupId: null,
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )
      assert.isOk(response.data && response.data.data && response.data.data.hr.length === 17, 'missing hr when imported')
    })
  })*/
}
