/**
 * Liste des juridictions qui ont accès
 */

export default (sequelizeInstance, Model) => {
  /**
   * Retourne les accès des juridictions à un utilisateur
   * @param {*} userId
   * @returns
   */
  Model.getUserVentilations = async (userId) => {
    const listAll = await Model.findAll({
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
    const list = []

    for (let i = 0; i < listAll.length; i++) {
      if (await Model.models.TJ.isVisible(listAll[i]['HRBackup.label'])) {
        list.push({
          id: listAll[i]['HRBackup.id'],
          label: listAll[i]['HRBackup.label'],
        })
      }
    }

    return list
  }

  /**
   * Mise à jour des accès à un utilisateur
   * @param {*} userId
   * @param {*} ventilationsIds
   * @returns
   */
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

    return list
  }

  return Model
}
