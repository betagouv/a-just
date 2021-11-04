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

  Model.duplicateBackup = async (backupId) => {
    const backup = await Model.findOne({
      where: {
        id: backupId,
      },
      raw: true,
    })

    if(backup) {
      delete backup.id
      const backupCreated = await Model.create({ ...backup, label: `${backup.label} - copie` })
      const newBackupId = backupCreated.dataValues.id

      const hrList = await Model.models.HumanResources.findAll({
        where: {
          backup_id: backupId,
        },
        raw: true,
      })
      for(let x = 0; x < hrList.length; x++) {
        const hrId = hrList[x].id
        delete hrList[x].id
        const newHR = await Model.models.HumanResources.create({
          ...hrList[x],
          backup_id: newBackupId,
        })

        const ventilationsList = await Model.models.HRVentilations.findAll({
          where: {
            backup_id: backupId,
            rh_id: hrId,
          },
          raw: true,
        })
        for(let x = 0; x < ventilationsList.length; x++) {
          delete ventilationsList[x].id
          await Model.models.HRVentilations.create({
            ...ventilationsList[x],
            backup_id: newBackupId,
            rh_id: newHR.dataValues.id,
          })
        }
      }

      return newBackupId
    } else {
      return null
    }
  }

  return Model
}