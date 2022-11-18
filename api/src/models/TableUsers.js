import { roleToString } from '../constants/roles'
import { accessToString } from '../constants/access'
import { snakeToCamelObject } from '../utils/utils'
import { sentEmail } from '../utils/email'
import { TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED } from '../constants/email'

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

  Model.createAccount = async ({ email, password, firstName, lastName, tj, fonction }) => {
    const user = await Model.findOne({ where: { email } })

    if (!user) {
      await Model.create({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        tj, 
        fonction,
        status: 1,
      })
    } else {
      throw 'Email déjà existant'
    }
  }

  Model.getAll = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'email', ['first_name', 'firstName'], ['last_name', 'lastName'], 'role', 'tj', 'fonction'],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i].access = await Model.models.UsersAccess.getUserAccess(list[i].id)
      list[i].accessName = list[i].access.map(a => accessToString(a)).join(', ')
      list[i].roleName = roleToString(list[i].role)
      list[i].ventilations = await Model.models.UserVentilations.getUserVentilations(list[i].id)
    }

    return list
  }

  Model.updateAccount = async ({ userId, access, ventilations }) => {
    const user = await Model.findOne({ 
      where: { 
        id: userId, 
      },
      raw: true,
    })

    if(user) {
      await Model.models.UsersAccess.updateAccess(userId, access)
      const ventilationsList = await Model.models.UserVentilations.updateVentilations(userId, ventilations)

      await sentEmail(
        {
          email: user.email,
        },
        TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED,
        {
          user: `${user.first_name} ${user.last_name}`,
          juridictionsList: ventilationsList.map(v => v.label).join(', '),
        }
      )
    } else {
      throw 'User not found'
    }
  }

  return Model
}
