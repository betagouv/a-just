export default (sequelizeInstance, Model) => {
  Model.getUserVentilations = async (userId) => {
    const list = await Model.findAll({
      attributes: ['id', 'user_id', 'hr_backup_id'],
      where: {
        user_id: userId,
      },
      include: [{
        attributes: ['id', 'label'],
        model: Model.models.HRBackups,
      }],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i]['HRBackup.id'],
        label: list[i]['HRBackup.label'],
      }
    }

    return list
  }

  Model.updateVentilations = async (userId, ventilationsIds) => {
    await Model.destroy({
      where: {
        user_id: userId,
      },
      force: true,
    })

    for(let i = 0; i < ventilationsIds.length; i++) {
      await Model.create({
        user_id: userId,
        hr_backup_id: ventilationsIds[i],
      })
    }

  }


  return Model
}