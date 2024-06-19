import { getNbDay } from '../utils/date'
import config from 'config'

export const ENUM_TYPE = {
  LOGIN: 'user_login',
}
export const ENTITY_NAME = {
  USERS: 'users',
}

/**
 * Gestion de token de connection
 */

export default (sequelizeInstance, Model) => {
  /**
   * Control si un token est valide
   * @param {*} param0
   * @returns
   */
  Model.isConsumable = async function ({ entity_id, token, type }) {
    const ref = await Model.findOne({ where: { entity_id, token, type }, logging: false })

    if (ref) {
      const date = new Date()
      //date.setDate(date.getDate() + 100)
      if (date < ref.dataValues.consumable_until) {
        ref.update({ updated_at: new Date() })
        return ref
      } else {
        await Model.deleteToken(token)
      }
    }

    return null
  }

  /**
   * Utilise une token
   * @param {*} param0
   * @returns
   */
  Model.consumeOne = async function ({ token }) {
    const ref = await Model.findOne({ where: { token } })
    if(ref) {
      ref.nb_consumable -= 1
      return ref.save()
    }
  }

  /**
   * Suppression d'un token de connection
   * @param {*} token
   * @returns
   */
  Model.deleteToken = async function (token) {
    const ref = await Model.findOne({ where: { token } })
    if (ref) {
      return ref.destroy()
    }

    return false
  }

  /**
   * Crée un token de connection
   * @param {*} param0
   * @returns
   */
  Model.createLogin = async function ({ entity_id, token, consumable_until = null }) {
    return Model.create({
      entity_id,
      entity_name: ENTITY_NAME.USERS,
      token,
      consumable_until,
      type: ENUM_TYPE.LOGIN,
    }).catch(console.error)
  }

  return Model
}
