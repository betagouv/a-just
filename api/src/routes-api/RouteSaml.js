import Route from './Route'
import { Types } from '../utils/types'
import { loginSSO, logoutSSO, postAssertSSO, sp } from '../utils/justice-sso'
import config from 'config'

/**
 * Route des SAML2
 */
export default class RouteSaml extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'Users' })
  }

  /**
   * metadata saml
   */
  @Route.Get({
    path: '/metadata.xml',
  })
  async metadata (ctx) {
    ctx.type = 'application/xml'
    ctx.body = sp.create_metadata()
  }

  /**
   * login saml
   */
  @Route.Get()
  async login (ctx) {
    try {
      const loginUrl = await loginSSO()
      if (loginUrl) {
        ctx.res
          .writeHead(302, {
            Location: loginUrl,
          })
          .end()
      }
    } catch (err) {
      ctx.throw(401, err)
    }
  }

  /**
   * logout saml
   */
  @Route.Get()
  async logout (ctx) {
    try {
      if (!ctx.session.sso.assert) {
        throw 'Erreur de session'
      }

      const logoutUrl = await logoutSSO(ctx.session.sso.assert)
      if (logoutUrl) {
        ctx.res
          .writeHead(302, {
            Location: logoutUrl,
          })
          .end()
      }
    } catch (err) {
      ctx.throw(401, err)
    }
  }

  /**
   * Get current session of user
   * @param {*} request_body
   */
  @Route.Post({
    bodyType: Types.any(),
  })
  async assert (ctx) {
    try {
      const assert = await postAssertSSO(this.body(ctx))
      if (assert) {
        if (!ctx.session.sso) {
          ctx.session.sso = { assert: null }
        }
        ctx.session.sso.assert = assert
      }

      this.sendOk(ctx, 'OK')
    } catch (err) {
      ctx.throw(401, err)
    }
  }

  /**
   * Get SSO Url
   */
  @Route.Get()
  async getUrl (ctx) {
    this.sendOk(ctx, config.sso.url)
  }
}
