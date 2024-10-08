import config from 'config'
import { crypt } from '../../utils'
import { ENUM_TYPE } from '../../models/TableTokens'

/**
 * Fonction qui ajoute un object de type user de l'utilisateur connecté
 * @param {*} ctx
 * @returns
 */
async function addUserToCtx(ctx) {
  const token = ctx.get('Authorization')
  if (token) {
    try {
      const user = crypt.getDataJwtToken(token)
      if (user) {
        const isConsumable = await ctx.models.tokens.isConsumable({
          entity_id: user.id,
          token,
          type: ENUM_TYPE.LOGIN,
        })
        if (isConsumable && user.loginTokenVersion === config.loginTokenVersion) {
          ctx.state.user = user
        }
      }
    } catch (error) {
      console.log(error)
      return error
    }
  }
  return null
}

/**
 * Fonction pour créer un token d'un utilisateur connecté
 * @param {*} ctx
 * @returns
 */
function loginUser(ctx) {
  return async (user, tokenValidity) => {
    const validityDate = new Date()
    validityDate.setDate(validityDate.getDate() + tokenValidity)

    const userToRegister = {
      id: user.id,
      role: user.role,
      access: await ctx.models.UsersAccess.getUserAccess(user.id),
      loginTokenVersion: config.loginTokenVersion,
      date: new Date(),
    }
    const token = crypt.generateJwtToken(userToRegister)
    await ctx.models.tokens.createLogin({ entity_id: user.id, token, consumable_until: validityDate })
    ctx.state.user = userToRegister
    ctx.body = { ...ctx.body }
    ctx.body.token = token
    ctx.body.expires = userToRegister.expires
    return { token, expires: userToRegister.expires }
  }
}

/**
 * Fonction qui supprime le token d'un utilisateur
 * @param {*} ctx
 * @returns
 */
function logoutUser(ctx) {
  return async () => {
    const token = ctx.get('Authorization')
    if (token) {
      await ctx.models.tokens.consumeOne({ token })
      await ctx.models.tokens.deleteToken(token)
    }
    ctx.state.user = undefined
  }
}

/**
 * Module d'export autour de l'utilisateur connecté
 */
export default async (ctx, next) => {
  await addUserToCtx(ctx)
  ctx.loginUser = loginUser(ctx)
  ctx.logoutUser = logoutUser(ctx)
  await next()
}
