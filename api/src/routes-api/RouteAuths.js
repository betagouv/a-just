import Route from './Route'
import { Types } from '../utils/types'
import { USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN, USER_ROLE_TEAM } from '../constants/roles'
import {
  USER_AUTH_BY_2FA,
  USER_AUTO_LOGIN,
  USER_USER_LOGIN,
  USER_USER_LOGIN_CODE_INVALID,
  USER_USER_LOGIN_REQUEST_CODE,
  USER_USER_PASSWORD_CHANGED,
  USER_USER_SIGN_IN,
} from '../constants/log-codes'
import { LOGIN_STATUS_GET_CODE } from '../constants/login'
import { crypt } from '../utils'
import { sentEmail } from '../utils/email'
import { TEMPLATE_2_AUTH_USER_LOGIN, TEMPLATE_2_AUTH_USER_LOGIN_CA } from '../constants/email'
import config from 'config'
import { Op } from 'sequelize'

/**
 * Route des authentification
 */
export default class RouteAuths extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)

    this.model = params.models.Users
  }

  /**
   * Interface de connexion utilisateur
   * @param {*} email
   * @param {*} password
   */
  @Route.Post({
    bodyType: Types.object().keys({
      email: Types.string(),
      password: Types.string(),
      remember: Types.number(),
    }),
  })
  async login(ctx) {
    const { password, remember } = this.body(ctx)
    let { email } = this.body(ctx)
    email = (email || '').toLowerCase()
    const tryUserCon = await this.model.tryConnection(email, password, [0, USER_ROLE_TEAM, USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN], true)
    if (typeof tryUserCon === 'string') {
      ctx.throw(401, tryUserCon)
    } else {
      let required2Auth = config.login.enable2Auth
      if (required2Auth) {
        const now = new Date()
        now.setMonth(now.getMonth() - 1)
        const nbAuthBy2FAOffMonth = (
          await this.models.Logs.getLogs({
            code_id: [USER_AUTH_BY_2FA, USER_USER_PASSWORD_CHANGED, USER_USER_SIGN_IN],
            user_id: tryUserCon.id,
            created_at: { [Op.gte]: now },
          })
        ).length

        if (nbAuthBy2FAOffMonth >= config.login.max2AuthByMonth) {
          required2Auth = false
        }
      }

      if (required2Auth) {
        const code = crypt.generateRandomNumber(4)
        ctx.session.loginControl = {
          email,
          remember,
          code,
          catchLogs: true,
        }
        await sentEmail(
          {
            email,
          },
          Number(config.juridictionType) === 1 ? TEMPLATE_2_AUTH_USER_LOGIN_CA : TEMPLATE_2_AUTH_USER_LOGIN,
          {
            email,
            code,
          },
        )
        await this.models.Logs.addLog(USER_USER_LOGIN_REQUEST_CODE, tryUserCon.id, {
          userId: tryUserCon.id,
        })
        this.sendOk(ctx, {
          status: LOGIN_STATUS_GET_CODE,
          datas: {
            code: config.login.shareAuthCode ? code : null,
          },
        })
      } else {
        await ctx.loginUser(tryUserCon, remember === 1 ? 90 : 7)
        await this.models.Logs.addLog(USER_USER_LOGIN, tryUserCon.id, {
          userId: tryUserCon.id,
        })
        await super.addUserInfoInBody(ctx, tryUserCon.id)
        this.sendCreated(ctx)
      }
    }
  }

  /**
   * Interface de connexion utilisateur
   * @param {*} email
   * @param {*} password
   */
  @Route.Post({
    bodyType: Types.object().keys({
      code: Types.string(),
    }),
  })
  async completeLogin(ctx) {
    const { code } = this.body(ctx)

    if (!ctx.session || !ctx.session.loginControl) {
      ctx.throw(401, "Nous n'arrivons pas à vous identifier !")
    }

    const userInDb = await this.model.userPreviewWithEmail(ctx.session.loginControl.email)

    if (ctx.session.loginControl.code !== code) {
      if (ctx.session.loginControl.catchLogs) {
        await this.models.Logs.addLog(USER_USER_LOGIN_CODE_INVALID, userInDb.id, {
          userId: userInDb.id,
        })
      }
      ctx.throw(401, 'Code invalide !')
    }

    const remember = ctx.session.loginControl.remember
    if (userInDb) {
      await ctx.loginUser(userInDb, remember === 1 ? 90 : 7)
      if (ctx.session.loginControl.catchLogs) {
        await this.models.Logs.addLog(USER_USER_LOGIN, userInDb.id, {
          userId: userInDb.id,
        })
        await this.models.Logs.addLog(USER_AUTH_BY_2FA, userInDb.id, {
          userId: userInDb.id,
        })
      }
      await super.addUserInfoInBody(ctx, userInDb.id)
      this.sendCreated(ctx)
    }
  }

  /**
   * Interface de connexion administrateur (For test only)
   * @param {*} email
   * @param {*} password
   */
  @Route.Post({
    bodyType: Types.object().keys({
      email: Types.string(),
      password: Types.string(),
    }),
  })
  async loginAdminTest(ctx) {
    if (process.env.NODE_ENV !== 'test') {
      ctx.throw(401, "Cette route n'est pas disponible")
      return
    }

    const { password, email } = this.body(ctx)

    const tryUserCon = await this.model.tryConnection(email, password, [USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN])
    if (typeof tryUserCon === 'string') {
      ctx.throw(401, tryUserCon)
    } else {
      const now = new Date()
      now.setMonth(now.getMonth() - 6)
      const nbAuthBy2FAOffMonth = (
        await this.models.Logs.getLogs({
          code_id: USER_USER_PASSWORD_CHANGED,
          user_id: tryUserCon.id,
          created_at: { [Op.gte]: now },
        })
      ).length

      await ctx.loginUser(tryUserCon, 7)
      await super.addUserInfoInBody(ctx, tryUserCon.id)
      this.sendCreated(ctx)
    }
  }

  /**
   * Interface de connexion administrateur
   * @param {*} email
   * @param {*} password
   */
  @Route.Post({
    bodyType: Types.object().keys({
      email: Types.string(),
      password: Types.string(),
    }),
  })
  async loginAdmin(ctx) {
    const { password, email } = this.body(ctx)

    const tryUserCon = await this.model.tryConnection(email, password, [USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN])
    if (typeof tryUserCon === 'string') {
      ctx.throw(401, tryUserCon)
    } else {
      const now = new Date()
      now.setMonth(now.getMonth() - 6)
      const nbAuthBy2FAOffMonth = (
        await this.models.Logs.getLogs({
          code_id: USER_USER_PASSWORD_CHANGED,
          user_id: tryUserCon.id,
          created_at: { [Op.gte]: now },
        })
      ).length

      if (nbAuthBy2FAOffMonth === 0) {
        ctx.throw(401, 'Vous devez changer de mot de passe tous les 6 mois !')
      } else {
        let required2Auth = config.login.enable2Auth
        if (required2Auth) {
          const now = new Date()
          now.setMonth(now.getMonth() - 1)
          const nbAuthBy2FAOffMonth = (
            await this.models.Logs.getLogs({
              code_id: USER_AUTH_BY_2FA,
              user_id: tryUserCon.id,
              created_at: { [Op.gte]: now },
            })
          ).length

          if (nbAuthBy2FAOffMonth >= config.login.max2AuthByMonth) {
            required2Auth = false
          }
        }

        if (required2Auth) {
          const code = crypt.generateRandomNumber(4)
          ctx.session.loginControl = {
            email,
            code,
            catchLogs: false,
          }
          await sentEmail(
            {
              email,
            },
            Number(config.juridictionType) === 1 ? TEMPLATE_2_AUTH_USER_LOGIN_CA : TEMPLATE_2_AUTH_USER_LOGIN,
            {
              email,
              code,
            },
          )
          this.sendOk(ctx, {
            status: LOGIN_STATUS_GET_CODE,
            datas: {
              code: config.login.shareAuthCode ? code : null,
            },
          })
        } else {
          await ctx.loginUser(tryUserCon, 7)
          await super.addUserInfoInBody(ctx, tryUserCon.id)
          this.sendCreated(ctx)
        }
      }
    }
  }

  /**
   * Interface de control de qui est connecté
   */
  @Route.Get({})
  async autoLogin(ctx) {
    if (this.userId(ctx)) {
      await super.addUserInfoInBody(ctx)
      await this.models.Logs.addLog(USER_AUTO_LOGIN, ctx.state.user.id, {
        userId: ctx.state.user.id,
      })

      this.sendOk(ctx)
    } else {
      ctx.throw(401)
    }
  }

  /**
   * Interface de control de qui est l'administrateur connecté
   */
  @Route.Get({})
  async autoLoginAdmin(ctx) {
    console.log('autoLoginAdmin', ctx.state.user)
    if (this.userId(ctx) && [USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN].indexOf(ctx.state.user.role) !== -1) {
      await super.addUserInfoInBody(ctx)
      this.sendOk(ctx)
    } else {
      ctx.throw(401)
    }
  }

  /**
   * Suppression du token de l'utilisateur connecté
   */
  @Route.Get({})
  async logout(ctx) {
    await ctx.logoutUser()
  }
}
