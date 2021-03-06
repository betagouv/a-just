import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { accessList } from '../constants/access'
import { validateEmail } from '../utils/utils'
import { crypt } from '../utils'
import { sentEmail } from '../utils/email'
import { TEMPLATE_FORGOT_PASSWORD_ID, TEMPLATE_NEW_USER_SIGNIN } from '../constants/email'
import config from 'config'
import { ADMIN_CHANGE_USER_ACCESS, USER_USER_FORGOT_PASSWORD, USER_USER_SIGN_IN } from '../constants/log-codes'

export default class RouteUsers extends Route {
  constructor (params) {
    super({ ...params, model: 'Users' })
  }

  @Route.Get()
  async me (ctx) {
    if (ctx.state && ctx.state.user) {
      const user = await this.model.userPreview(ctx.state.user.id)
      this.sendOk(ctx, user)
    } else {
      this.sendOk(ctx, null)
    }
  }

  @Route.Post({
    bodyType: Types.object().keys({
      email: Types.string().required(),
      password: Types.string().required(),
      firstName: Types.string(),
      lastName: Types.string(),
    }),
  })
  async createAccount (ctx) {
    const { email, firstName, lastName } = this.body(ctx)
    try {
      await this.model.createAccount(this.body(ctx))
      await sentEmail(
        {
          email: config.contactEmail,
        },
        TEMPLATE_NEW_USER_SIGNIN,
        {
          email,
          serverUrl: config.frontUrl,
        }
      )
      await this.models.Logs.addLog(USER_USER_SIGN_IN, null, { email, firstName, lastName })
      this.sendOk(ctx, 'OK')
    } catch (err) {
      ctx.throw(401, err)
    }
  }

  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getAll (ctx) {
    const list = await this.model.getAll()

    this.sendOk(ctx, {
      list,
      ventilations: await this.model.models.HRBackups.getAll(),
      access: accessList,
    })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      userId: Types.number().required(),
      access: Types.any().required(),
      ventilations: Types.any().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async updateAccount (ctx) {
    const { userId } = this.body(ctx)

    try {
      await this.model.updateAccount(this.body(ctx))
      await this.models.Logs.addLog(ADMIN_CHANGE_USER_ACCESS, ctx.state.user.id, { userId })
      this.sendOk(ctx, 'OK')
    } catch (err) {
      ctx.throw(401, err)
    }
  }

  @Route.Post({
    bodyType: Types.object().keys({
      email: Types.string().required(),
    }),
  })
  async forgotPassword (ctx) {
    let { email } = this.body(ctx)
    email = (email || '').trim().toLowerCase()

    if (validateEmail(email)) {
      // send message by email
      const user = await this.model.findOne({ where: { email } })
      if (user) {
        const key = crypt.generateRandomNumber(6)
        await user.update({ new_password_token: key })

        await sentEmail(
          {
            email,
          },
          TEMPLATE_FORGOT_PASSWORD_ID,
          {
            code: key,
            serverUrl: `${config.frontUrl}/nouveau-mot-de-passe?p=${key}`,
          }
        )
        await this.models.Logs.addLog(USER_USER_FORGOT_PASSWORD, null, { email })
        this.sendOk(
          ctx,
          'Votre demande de changement de mot de passe a bien ??t?? transmise. Vous aller recevoir, d\'ici quelques minutes, un e-mail de r??initialisation ?? l\'adresse correspondant ?? votre compte d\'inscription.'
        )
        return
      }
    }

    ctx.throw(401, ctx.state.__('Information de contact non valide!'))
  }

  @Route.Post({
    bodyType: Types.object().keys({
      email: Types.string().required(),
      code: Types.string().required(),
      password: Types.string().required(),
    }),
  })
  async changePassword (ctx) {
    let { email, code, password } = this.body(ctx)
    email = (email || '').trim().toLowerCase()

    const user = await this.model.findOne({
      where: { email, new_password_token: code },
    })
    if (user) {
      if (await user.update({ new_password_token: null, password })) {
        this.sendOk(ctx, {
          status: true,
          msg: 'Votre mot de passe est maintenant chang??. Vous pouvez d??s maintenant vous connecter.',
        })
      }
      return
    }

    ctx.throw(401, {
      status: false,
      msg: ctx.state.__('Information de contact non valide!'),
    })
  }
}
