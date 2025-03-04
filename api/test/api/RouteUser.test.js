import { USER_TEST_EMAIL, USER_TEST_FIRSTNAME, USER_TEST_FONCTION, USER_TEST_LASTNAME, USER_TEST_PASSWORD } from '../constants/user'
import { accessList } from '../../src/constants/access'
import { onForgotPasswordApi, onGetMyInfosApi, onGetUserDataApi, onGetUserListApi, onLoginApi, onLogoutApi, onSignUpApi , onUpdateAccountApi} from '../routes/user'
import { JURIDICTION_TEST_NAME } from '../constants/juridiction'

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
        tj: JURIDICTION_TEST_NAME,
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
        tj: JURIDICTION_TEST_NAME,
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
        tj: JURIDICTION_TEST_NAME,
        fonction: USER_TEST_FONCTION,
      })
      assert.strictEqual(response.status, 400)
    })

    /**
     *  Inscription - Vérification qu'on ait bien une erreur si le mot de passe n'est pas assez long
     */
    it('Sign up - Password is not long enough, should return 401', async () => {
      const response = await onSignUpApi({
        email: USER_TEST_EMAIL,
        password: '123456',
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        tj: JURIDICTION_TEST_NAME,
        fonction: USER_TEST_FONCTION,
      })
      assert.strictEqual(response.status, 401)
    })

    /**
     *  Inscription - Vérification qu'on ait bien une erreur si le mot de passe n'est pas assez fort
     */
    it('Sign up - Password is not strong enough, should return 401', async () => {
      const response = await onSignUpApi({
        email: USER_TEST_EMAIL,
        password: '123456789',
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        tj: JURIDICTION_TEST_NAME,
        fonction: USER_TEST_FONCTION,
      })
      assert.strictEqual(response.status, 401)
    })

    /**
     *  Inscription - Vérification qu'on ait bien une erreur si le mot de passe est un mot du dictionnaire
     */
    it('Sign up - Password is a word in dictionary, should return 401', async () => {
      const response = await onSignUpApi({
        email: "badPAssword@email.com",//USER_TEST_EMAIL,
        password: 'Zymotechnie',
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        tj: JURIDICTION_TEST_NAME,
        fonction: USER_TEST_FONCTION,
      })
      assert.strictEqual(response.status, 401)
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
        tj: JURIDICTION_TEST_NAME,
        fonction: USER_TEST_FONCTION,
      })
      datas.userId = response.data.user.id

      assert.strictEqual(response.status, 201)
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
        email: USER_TEST_EMAIL,
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Login - Vérification qu'un utilistaeur ne peut pas se connecter avec un mauvais mot de passe
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
     * 
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
     * Logout - Vérification que l'utilisateur peut bien se déconnecter
     */
    it('Logout - Logout should return 200', async () => {
      const response = await onLogoutApi({
        userToken: datas.userToken,
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Login - Reconnexion de l'utilisateur pour les prochains tests
     */
    it('Re Login - Login should succeed and return 201', async () => {
      const response = await onLoginApi({
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
      })
      datas.userToken = response.status === 201 && response.data.token
      assert.strictEqual(response.status, 201)
      assert.isOk(datas.userToken, 'response 201 and user token created')
    })

  })
}
