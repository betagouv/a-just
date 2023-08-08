import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { accessList } from '../constants/access'
import { validateEmail } from '../utils/utils'
import { crypt } from '../utils'
import { sentEmail } from '../utils/email'
import { TEMPLATE_FORGOT_PASSWORD_ID, TEMPLATE_NEW_USER_SIGNIN, TEMPLATE_USER_ONBOARDING } from '../constants/email'
import config from 'config'
import { ADMIN_CHANGE_USER_ACCESS, USER_USER_FORGOT_PASSWORD, USER_USER_SIGN_IN } from '../constants/log-codes'
import { getCategoriesByUserAccess } from '../utils/hr-catagories'
import { USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN } from '../constants/roles'

/**
 * Route de la gestion des utilisateurs
 */
export default class RouteUsers extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'Users' })
  }

  /**
   * Interface qui retourne l'utilisateur connecté
   */
  @Route.Get()
  async me (ctx) {
    if (ctx.state && ctx.state.user) {
      const user = await this.model.userPreview(ctx.state.user.id)
      this.sendOk(ctx, user)
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * Interface pour créer un compte
   * @param {*} email
   * @param {*} password
   * @param {*} firstName
   * @param {*} lastName
   * @param {*} tj
   * @param {*} fonction
   */
  @Route.Post({
    bodyType: Types.object().keys({
      email: Types.string().required(),
      password: Types.string().required(),
      firstName: Types.string(),
      lastName: Types.string(),
      tj: Types.string(),
      fonction: Types.string(),
    }),
  })
  async createAccount (ctx) {
    const { firstName, lastName, tj, fonction } = this.body(ctx)
    let { email } = this.body(ctx)

    email = (email || '').toLowerCase() // force to lower case email

    try {
      await this.model.createAccount({ ...this.body(ctx), email })
      await sentEmail(
        {
          email: config.supportEmail,
        },
        TEMPLATE_NEW_USER_SIGNIN,
        {
          email,
          serverUrl: config.frontUrl,
          tj,
          fonction,
        }
      )
      await sentEmail(
        {
          email,
        },
        TEMPLATE_USER_ONBOARDING,
        {
          serverUrl: config.frontUrl,
        }
      )
      await this.models.Logs.addLog(USER_USER_SIGN_IN, null, {
        email,
        firstName,
        lastName,
        tj,
        fonction,
      })
      this.sendOk(ctx, 'OK')
    } catch (err) {
      ctx.throw(401, err)
    }
  }

  /**
   * Interface pour supprimer un compte (For test only)
   */
  @Route.Delete({
    path: 'remove-account-test/:id',
    accesses: [Access.isAdmin],
  })
  async removeAccountTest (ctx) {
    const { id } = ctx.params

    const user = this.model.findOne({
      where: { id: id },
    })

    if (user) {
      if (
        ctx.state.user.id === user.id ||
        user.role === USER_ROLE_SUPER_ADMIN ||
        (ctx.state.user.role !== USER_ROLE_ADMIN && ctx.state.user.role !== USER_ROLE_SUPER_ADMIN)
      )
        ctx.throw(401, ctx.state.__("Vous n'avez pas les droits ou vous ne pouvez pas supprimer un super administrateur ou vous même"))

      if (await this.model.removeAccount(id, { force: true })) {
        this.sendOk(ctx, 'Ok')
      } else {
        ctx.throw(401, ctx.state.__('Code non valide!'))
      }
    } else ctx.throw(401, ctx.state.__('Utilisateur non trouvé'))
  }

  /**
   * Interface pour supprimer un compte (Admin only)
   */
  @Route.Delete({
    path: 'remove-account/:id',
    accesses: [Access.isAdmin],
  })
  async removeAccount (ctx) {
    const { id } = ctx.params
    const user = this.model.findOne({
      where: { id: id },
    })

    if (user) {
      if (
        ctx.state.user.id === user.id ||
        user.role === USER_ROLE_SUPER_ADMIN ||
        (ctx.state.user.role !== USER_ROLE_ADMIN && ctx.state.user.role !== USER_ROLE_SUPER_ADMIN)
      )
        ctx.throw(401, ctx.state.__("Vous n'avez pas les droits ou vous ne pouvez pas suppimer un super administrateur ou vous même"))

      if (await this.model.removeAccount(id, {})) {
        this.sendOk(ctx, 'Ok')
      } else {
        ctx.throw(401, ctx.state.__('Code non valide!'))
      }
    } else ctx.throw(401, ctx.state.__('Utilisateur non trouvé'))
  }

  /**
   * Interface de la liste de tout les utilisateurs
   */
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

  /**
   * Interface pour modifier les accès et juridictions d'un utilisateur
   * @param {*} userId
   * @param {*} access
   * @param {*} ventilations
   */
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
    const userToUpdate = await this.model.userPreview(userId)
    if (userToUpdate && userToUpdate.role === USER_ROLE_SUPER_ADMIN && ctx.state.user.role !== USER_ROLE_SUPER_ADMIN) {
      ctx.throw(401, "Vous ne pouvez pas modifier les droits d'un super administrateur.")
    }

    try {
      await this.model.updateAccount(this.body(ctx))
      await this.models.Logs.addLog(ADMIN_CHANGE_USER_ACCESS, ctx.state.user.id, { userId })
      this.sendOk(ctx, 'OK')
    } catch (err) {
      ctx.throw(401, err)
    }
  }

  /**
   * Interface pour générer une demande d'un mail pour changer de mot de passe
   * @param {*} email
   * @returns
   */
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
        await this.models.Logs.addLog(USER_USER_FORGOT_PASSWORD, null, {
          email,
        })
        this.sendOk(
          ctx,
          "Votre demande de changement de mot de passe a bien été transmise. Vous aller recevoir, d'ici quelques minutes, un e-mail de réinitialisation à l'adresse correspondant à votre compte d'inscription."
        )
        return
      }
    }

    ctx.throw(401, ctx.state.__('Information de contact non valide!'))
  }

  /**
   * Interface pour changer le mot de passe à la suite à une demande de changement de mot passe
   * @param {*} email
   * @param {*} code
   * @param {*} password
   * @returns
   */
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
      if (await this.model.updatePassword(user.dataValues.id, password, email)) {
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

  /**
   * Interface pour avoir une liste des données standard d'un utilisateur connecté
   */
  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getUserDatas (ctx) {
    this.sendOk(ctx, {
      backups: await this.models.HRBackups.list(ctx.state.user.id),
      categories: getCategoriesByUserAccess(await this.models.HRCategories.getAll(), ctx.state.user),
      fonctions: await this.models.HRFonctions.getAll(),
      referentiel: await this.models.ContentieuxReferentiels.getReferentiels(),
    })
  }
}
