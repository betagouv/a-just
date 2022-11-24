import { sentEmailSendinblueUserList } from '../utils/email'

export default (sequelizeInstance, Model) => {
  Model.getUserVentilations = async (userId) => {
    const list = await Model.findAll({
      attributes: ['id', 'user_id', 'hr_backup_id'],
      where: {
        user_id: userId,
      },
      include: [
        {
          attributes: ['id', 'label'],
          model: Model.models.HRBackups,
        },
      ],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i]['HRBackup.id'],
        label: list[i]['HRBackup.label'],
      }
    }

    return list
  }

  Model.updateVentilations = async (userId, ventilationsIds) => {
    const list = []
    await Model.destroy({
      where: {
        user_id: userId,
      },
      force: true,
    })

    for (let i = 0; i < ventilationsIds.length; i++) {
      const backup = await Model.models.HRBackups.findOne({
        attributes: ['id', 'label'],
        where: {
          id: ventilationsIds[i],
        },
        raw: true,
      })

      if (backup) {
        await Model.create({
          user_id: userId,
          hr_backup_id: ventilationsIds[i],
        })
        list.push(backup)
      }
    }

    await sentEmailSendinblueUserList(
      await Model.models.Users.findOne({
        where: {
          id: userId,
        },
        raw: true,
      }),
      list.length ? true : false
    )

    return list
  }

  return Model
}
