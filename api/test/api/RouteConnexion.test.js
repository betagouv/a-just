import axios from 'axios'
import config from 'config'
import { USER_TEST_EMAIL, USER_TEST_PASSWORD, USER_TEST_FIRSTNAME, USER_TEST_LASTNAME, USER_TEST_FONCTION } from './constants/user' 

module.exports = function () {
  describe('Login tests that should fail', () => {
    it('Bad password, should return 401', async () => {
      const email = USER_TEST_EMAIL
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
      const email = 'badEmail@mail.com'
      const password = USER_TEST_PASSWORD

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
      const email = 'badEmail@mail.com'
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
      const email = USER_TEST_EMAIL
      const password = USER_TEST_PASSWORD

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
          email: 'badEmail@mail.com',
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 401)
      }
    })
    it('Good email, should return 200', async () => {
      const response = await axios.post(`${config.serverUrl}/users/forgot-password`, {
        email: USER_TEST_EMAIL
      })

      assert.strictEqual(response.status, 200)
    })
  })

  describe('Sign up', () => {
    it('Missing email, should return 400', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/create-account`, {
          password: USER_TEST_PASSWORD,
          firstName: USER_TEST_FIRSTNAME,
          lastName: USER_TEST_LASTNAME,
          fonction: USER_TEST_FONCTION,
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 400)
      }
    })
    it('Missing password, should return 400', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/create-account`, {
          email: USER_TEST_EMAIL,
          firstName: USER_TEST_FIRSTNAME,
          lastName: USER_TEST_LASTNAME,
          fonction: USER_TEST_FONCTION,
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 400)
      }
    })
    it('Bad email, not @justice.gouv or @*.gouv.fr should return 400', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/create-account`, {
          email: 'test@mail.fr',
          password: USER_TEST_PASSWORD,
          firstName: USER_TEST_FIRSTNAME,
          lastName: USER_TEST_LASTNAME,
          fonction: USER_TEST_FONCTION,
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 400)
      }
    })
    it('Sign up - Missing email and password, should return 400', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/create-account`, {
          firstName: 'userTest',
          lastName: 'userTest',
          fonction: 'tester',
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 400)
      }
    })
    it('Correct inputs, should return 200', async () => {
      const response = await axios.post(`${config.serverUrl}/users/create-account`, {
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        fonction: USER_TEST_FONCTION,
      })
      assert.strictEqual(response.status, 200)
    })
  })
}
