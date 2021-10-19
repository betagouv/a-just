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
  
  return Model
}
