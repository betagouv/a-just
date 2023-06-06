import { assert } from 'chai'
//import { USER_ADMIN_EMAIl, USER_ADMIN_PASSWORD } from '../constants/admin'
import { USER_TEST_EMAIL, USER_TEST_FIRSTNAME, USER_TEST_FONCTION, USER_TEST_LASTNAME, USER_TEST_PASSWORD } from '../constants/user'
import { USER_ADMIN_EMAIl, USER_ADMIN_PASSWORD } from '../constants/admin'
import { onForgotPasswordApi, onGetMyInfosApi, onGetUserDataApi, onGetUserListApi, onLoginApi, onLogoutApi, onSignUpApi } from '../routes/user'

module.exports = function (datas) {
  describe('Users tests', () => {
    /**
     *  Inscription - Vérification qu'on ait bien un erreur si le mail n'est pas indiqué
     */
    it('Sign up - Missing email, should return 400', async () => {
      const response = await onSignUpApi({
        password: USER_TEST_PASSWORD,
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        fonction: USER_TEST_FONCTION,
      })
      assert.strictEqual(response.status, 400)
    })
    /**
     *  Inscription - Vérification qu'on ait bien un erreur si le mot de passe n'est pas indiqué
     */
    it('Sign up - Missing password, should return 400', async () => {
      const response = await onSignUpApi({
        email: USER_TEST_EMAIL,
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        fonction: USER_TEST_FONCTION,
      })
      assert.strictEqual(response.status, 400)
    })
    /**
     *  Inscription - Vérification qu'on ait bien un erreur si l'email et le mot de passe ne sont pas indiqués
     */
    it('Sign up - Missing email and password, should return 400', async () => {
      const response = await onSignUpApi({
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        fonction: USER_TEST_FONCTION,
      })
      assert.strictEqual(response.status, 400)
    })

    /**
     *  Inscription - Vérification que l'utilisateur peut bien s'inscrire si toutes les information obligatoires sont données
     */
    it('Sign up - Correct inputs, should return 200', async () => {
      const response = await onSignUpApi({
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        fonction: USER_TEST_FONCTION,
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Mot de passe oublié - Vérification qu'on ait bien une erreur si l'email indiqué n'est pas reconnu
     */
    it('Forgot password - Bad email, should return 401', async () => {
      const response = await onForgotPasswordApi({ email: 'badEmail@mail.com' })
      assert.strictEqual(response.status, 401)
    })
    /**
     * Mot de passe oublié - Vérification que l'utilisateur puisse bien changer son mot de passe en cas de perte
     */
    it('Forgot password - Good email, should return 200', async () => {
      const response = await onForgotPasswordApi({
        email: 'redwane.zafari@a-just.fr', //USER_TEST_EMAIL,
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Login - Vérification qu'on ait bien un erreur si le mot de passe n'est pas correct
     */
    it('Login - Bad password, should return 401', async () => {
      const response = await onLoginApi({
        email: USER_TEST_EMAIL,
        password: '123481349',
      })
      assert.strictEqual(response.status, 401)
    })
    /**
     * Login - Vérification qu'on ait bien un erreur si l'email n'est pas correct
     */
    it('Login - Bad email, should return 401', async () => {
      const response = await onLoginApi({
        email: 'badEmail@email.com',
        password: USER_TEST_PASSWORD,
      })

      assert.strictEqual(response.status, 401)
    })
    /**
     * Login - Vérification qu'on ait bien un erreur si le mot de passe et l'email ne sont pas corrects
     */
    it('Login - Bad email AND bad password, should return 401', async () => {
      const response = await onLoginApi({
        email: 'badEmail@mail.com',
        password: '124134683',
      })
      assert.strictEqual(response.status, 401)
    })

    /**
     * Login - Vérification que la connexion avec les bonnes infos fonctionne
     */
    it('Login - Login should succeed and return 201 with user token', async () => {
      const response = await onLoginApi({
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
      })
      datas.userToken = response.status === 201 && response.data.token
      datas.userId = response.data.user.id

      assert.isOk(datas.userToken, 'response 201 and user token created')
    })

    /**
     * Get my info as a user
     */
    it('Get my infos as a user. Should return 200', async () => {
      const response = await onGetMyInfosApi({
        userToken: datas.userToken,
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Get my datas as a connected user
     */
    it('Get my datas as a connected user. Should return 200', async () => {
      const response = await onGetUserDataApi({
        userToken: datas.userToken,
      })
      assert.strictEqual(response.status, 200)
    })
    /**
     * Vérification qu'un simple utilisateur ne puisse accéder à la liste complète des utilisateurs
     */
    it('User list - Normal user do not have access. Should return 403', async () => {
      const response = await onGetUserListApi({
        userToken: datas.userToken,
      })
      assert.strictEqual(response.status, 403)
    })

    /**
     * Vérification qu'un admin puisse accéder à la liste complète des utilisateurs
     */
    it('User list - Admin should have access. Should return 200', async () => {
      const response = await onGetUserListApi({
        userToken: datas.adminToken,
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Logout - Vérification que l'utilisateur peur bien se déconnecter
     */
    it('Logout - Logout should return 200', async () => {
      const response = await onLogoutApi({
        userToken: datas.userToken,
      })
      assert.strictEqual(response.status, 200)
    })
  })
}
