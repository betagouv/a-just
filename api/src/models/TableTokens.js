export const ENUM_TYPE = {
  LOGIN: 'user_login',
}
export const ENTITY_NAME = {
  USERS: 'users',
}

export default (sequelizeInstance, Model) => {
  Model.isConsumable = async function ({ entity_id, token, type }) {
    const ref = await Model.findOne({ where: { entity_id, token, type }, logging: false })
    return ref && ref
  }

  Model.consumeOne = async function ({ token }) {
    const ref = await Model.findOne({ where: { token } })
    ref.nb_consumable -= 1
    return ref.save()
  }

  Model.deleteToken = async function (token) {
    const ref = await Model.findOne({ where: { token } })
    if(ref) {
      return ref.destroy()
    } 

    return false
  }

  Model.checkAndConsume = async function ({ entity_id, token, type, message_error }) {
    const isConsumable = await Model.isConsumable({
      entity_id,
      token,
      type,
    })
    if (!isConsumable) {
      Model.throw(400, message_error)
    }
    await Model.consumeOne({ token })
  }

  Model.consumeAll = async function ({ entity_id, type }) {
    return Model.updateAll({ nb_consumable: 0 }, { where: { entity_id, type } })
  }

  // CREATE
  Model.createLogin = async function ({ entity_id, token }) {
    return Model.create({
      entity_id,
      entity_name: ENTITY_NAME.USERS,
      token,
      type: ENUM_TYPE.LOGIN,
    }).catch(console.error)
  }

  return Model
}
