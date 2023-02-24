import axios from 'axios'
import config from 'config'
import { assert } from 'chai'

module.exports = function (adminToken, userId) {
  describe('Users tests', () => {
    /**
     *  Vérification qu'on ait bien un erreur si le mail n'est pas indiqué
     */
    it('Sign up - Missing email, should return 400', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/create-account`, {
          password: '123456',
          firstName: 'userTest',
          lastName: 'userTest',
          fonction: 'tester',
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 400)
      }
    })
    /**
     *  Vérification qu'on ait bien un erreur si le mot de passe n'est pas indiqué
     */
    it('Sign up - Missing password, should return 400', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/create-account`, {
          email: 'test@mail.com',
          firstName: 'userTest',
          lastName: 'userTest',
          fonction: 'tester',
        })
      } catch (error) {}
    })
    /**
     *  Vérification qu'on ait bien un erreur si l'email et le mot de passe ne sont pas indiqués
     */
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
    /**
     *  Vérification que l'utilisateur peut bien s'inscrire si toutes les information obligatoires sont données
     */
    it('Sign up - Correct inputs, should return 200', async () => {
      const response = await axios.post(`${config.serverUrl}/users/create-account`, {
        email: 'test@mail.com',
        password: '123456',
        firstName: 'userTest',
        lastName: 'userTest',
        fonction: 'tester',
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Vérification qu'on ait bien une erreur si l'email indiqué n'est pas reconnu
     */
    it('Forgot password - Bad email, should return 401', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/forgot-password`, {
          email: 'test@mail.fr',
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 401)
      }
    })
    /**
     * Vérification que l'utilisateur puisse bien changer son mot de passe en cas de perte
     */
    it('Forgot password - Good email, should return 200', async () => {
      const response = await axios.post(`${config.serverUrl}/users/forgot-password`, {
        email: 'test@mail.com',
      })

      assert.strictEqual(response.status, 200)
    })
  })
}
