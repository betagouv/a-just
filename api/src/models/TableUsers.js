import { snakeToCamelObject } from '../utils/utils'

export default (sequelizeInstance, Model) => {
  Model.userPreview = async (userId) => {
    const user = await Model.findOne({
      attributes: ['email', 'first_name', 'last_name'],
      where: { id: userId },
      raw: true,
    })

    if (user) {
      return snakeToCamelObject(user)
    }

    return null
  }

  Model.createAccount = async ({ email, password }) => {
    const user = await Model.findOne({ where: { email } })

    if(!user) {
      await Model.create({ email, password, status: 1 })
    } else {
      throw 'Email déjà existant'
    }
  }
  
  return Model
}
