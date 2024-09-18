import config from 'config'

/**
 * Table de stockage des notifications
 */

import { TEMPLATE_NOTIFICATION } from '../constants/email'
import { USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN } from '../constants/roles'
import { sentEmail } from '../utils/email'

export default (sequelizeInstance, Model) => {
  /**
   * Ajouter une notif en base
   * @param {*} HRBackupId
   * @returns
   */
  Model.addNotification = async ({ title, content, to, isAdmin = false }) => {
    let user
    if (to === -1) {
      user = {
        email: config.supportEmail,
        first_name: 'Équipe support',
      }
    } else {
      user = await Model.models.Users.findOne({
        where: {
          id: to,
        },
        raw: true,
      })
    }

    if (user) {
      await Model.create({
        content,
        title,
        to_user_id: to,
        is_admin: isAdmin,
      })
      await sentEmail(
        {
          email: user.email,
        },
        TEMPLATE_NOTIFICATION,
        {
          title,
          content,
          name: user.first_name,
        }
      )
    }

    return null
  }

  Model.toAdmins = async (title, content) => {
    const users = await Model.models.Users.findAll({
      where: {
        role: [USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN],
      },
      raw: true,
    })

    for (let i = 0; i < users.length; i++) {
      await Model.addNotification({ title, content, to: users[i].id, isAdmin: true })
    }
  }

  Model.toSupport = async (title, content) => {
    await Model.addNotification({ title, content, to: -1, isAdmin: false })
  }

  return Model
}
