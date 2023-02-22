import axios from 'axios'
import config from 'config'
import { assert } from 'chai'

module.exports = function () {
  describe('Login tests that should fail', () => {
    it('Bad password, should return 401', async () => {
      const email = 'redwane.zafari@a-just.fr'
      const password = '1234859'

      try {
        await axios.post(`${config.serverUrl}/auths/login`, {
          email,
          password,
        })
      } catch (error) {
        assert.notStrictEqual(error.response.status, 201)
      }
    })
    it('Bad email, should return 401', async () => {
      const email = 'redwane.zafari@a-just.com'
      const password = '123456'

      try {
        await axios.post(`${config.serverUrl}/auths/login`, {
          email,
          password,
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 401)
      }
    })
    it('Bad email AND bad password, should return 401', async () => {
      const email = 'redwane.zafari@a-just.com'
      const password = '1243627'

      try {
        await axios.post(`${config.serverUrl}/auths/login`, {
          email,
          password,
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 401)
      }
    })
  })
  describe('Login test that should succeed then logout', () => {
    let token = null
    it('Login should return 201 with user token', async () => {
      const email = 'redwane.zafari@a-just.fr'
      const password = '123456'

      const response = await axios.post(`${config.serverUrl}/auths/login`, {
        email,
        password,
      })
      token = response.status === 201 && response.data.token
      assert.isOk(token, 'response 201 and user token created')
    })
    it('Logout should return 200', async () => {
      const response = await axios.get(`${config.serverUrl}/auths/logout`, {
        headers: {
          authorization: token,
        },
      })
      assert.strictEqual(response.status, 200)
    })
  })
  describe('Forgot password', () => {
    it('Bad email, should return 401', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/forgot-password`, {
          email: 'redwane.zafari@a-just.com',
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 401)
      }
    })
    it('Good email, should return 200', async () => {
      const response = await axios.post(`${config.serverUrl}/users/forgot-password`, {
        email: 'redwane.zafari@a-just.fr',
      })

      assert.strictEqual(response.status, 200)
    })
  })
}
