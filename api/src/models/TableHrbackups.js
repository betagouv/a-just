export default (sequelizeInstance, Model) => {
  Model.createWithLabel = async (label) => {
    const creation = await Model.create({
      label,
    })

    return creation.dataValues.id
  }

  Model.lastId = async () => {
    const lastBackup = await Model.findAll({
      order: [['id', 'desc']],
      limit: 1,
    })

    return lastBackup.length ? lastBackup[0].dataValues.id : null
  }

  Model.list = async () => {
    return await Model.findAll({
      attributes: ['id', 'label', ['created_at', 'date']],
    })
  }

  Model.removeBackup = async (backupId) => {
    await Model.destroy({
      where: {
        id: backupId,
      },
    })

    await Model.models.HumanResources.destroy({
      where: {
        backup_id: backupId,
      },
    })

    await Model.models.HRVentilations.destroy({
      where: {
        backup_id: backupId,
      },
    })
  }

  return Model
}