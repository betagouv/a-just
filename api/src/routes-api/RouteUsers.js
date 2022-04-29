import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { accessList } from '../constants/access'
import { validateEmail } from '../utils/utils'
import { crypt } from '../utils'
import { sentEmail } from '../utils/email'
import { TEMPLATE_FORGOT_PASSWORD_ID } from '../constants/email'
import config from 'config'

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
    try {
      await this.model.createAccount(this.body(ctx))
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
    try {
      await this.model.updateAccount(this.body(ctx))
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
        this.sendOk(
          ctx,
          'Votre demande de changement de mot de passe a bien été transmise. Vous aller recevoir, d\'ici quelques minutes, un e-mail de réinitialisation à l\'adresse correspondant à votre compte d\'inscription.'
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
          msg: 'Votre mot de passe est maintenant changé. Vous pouvez dès maintenant vous connecter.',
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
