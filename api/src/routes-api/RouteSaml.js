import Route from './Route'
import { Types } from '../utils/types'
import { loginSSO, logoutSSO, postAssertSSO, sp } from '../utils/justice-sso'
import config from 'config'
import { SAML_STATUS_EMPTY, SAML_STATUS_PENDING } from '../constants/saml'
import { USER_USER_LOGIN } from '../constants/log-codes'

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
  async assertReturn (ctx) {
    try {
      const assert = await postAssertSSO(this.body(ctx))
      if (assert) {
        ctx.session.sso = assert
      }

      ctx.redirect(config.frontUrl)
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

  /**
   * Get SSO Url
   */
  @Route.Get()
  async status (ctx) {
    const email = (ctx.session.sso?.email || '').toLowerCase()
    const firstName = ctx.session.sso?.firstName || ''
    const lastName = ctx.session.sso?.lastName || ''

    const userInDb = await this.model.userPreviewWithEmail(email)
    if (userInDb) {
      await ctx.loginUser(userInDb, 7)
      await this.models.Logs.addLog(USER_USER_LOGIN, userInDb.id, {
        userId: userInDb.id,
      })
      await super.addUserInfoInBody(ctx, userInDb.id)
      this.sendCreated(ctx)
    } else if (email) {
      this.sendOk(ctx, {
        status: SAML_STATUS_PENDING,
        datas: {
          email,
          firstName,
          lastName,
        },
      })
    } else {
      this.sendOk(ctx, {
        status: SAML_STATUS_EMPTY,
      })
    }
  }
}
