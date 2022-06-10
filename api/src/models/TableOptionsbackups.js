export default (sequelizeInstance, Model) => {
  Model.getBackup = async (userId, juridictionId) => {
    const list = await Model.findAll({
      attributes: ['id', 'label', ['created_at', 'date']],
      include: [{
        model: Model.models.OptionsBackupJuridictions,
        required: true,
        where: {
          juridiction_id: juridictionId,
        },
        include: [{ 
          model: Model.models.UserVentilations,
          required: true,
          where: {
            user_id: userId,
          },
        }],
      }],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        label: list[i].label,
        date: list[i].date,
      }
    }

    return list
  }

  Model.removeBackup = async (backupId) => {
    await Model.destroy({
      where: {
        id: backupId,
      },
    })

    await Model.models.ContentieuxOptions.destroy({
      where: {
        backup_id: backupId,
      },
    })
  }

  Model.duplicateBackup = async (backupId, backupName, juridictionId) => {
    const backup = await Model.findOne({
      where: {
        id: backupId,
      },
      raw: true,
    })

    if(backup) {
      delete backup.id
      const backupCreated = await Model.create({ ...backup, label: backupName })
      const newBackupId = backupCreated.dataValues.id

      const hrList = await Model.models.ContentieuxOptions.findAll({
        where: {
          backup_id: backupId,
        },
        raw: true,
      })
      for(let x = 0; x < hrList.length; x++) {
        delete hrList[x].id
        await Model.models.ContentieuxOptions.create({
          ...hrList[x],
          backup_id: newBackupId,
        })
      }

      await Model.models.OptionsBackupJuridictions.create({
        option_backup_id: newBackupId,
        juridiction_id: juridictionId,
      })

      return newBackupId
    } else {
      return null
    }
  }

  Model.saveBackup = async (list, backupId, backupName) => {
    let newBackupId = backupId
    let reelIds = []
    // if backup name create a copy
    if(backupName) {
      const newBackup = await Model.create({
        label: backupName,
      })
      newBackupId = newBackup.dataValues.id
    }

    for(let x = 0; x < list.length; x++) {
      const op = list[x]

      const options = {
        contentieux_id: op.contentieux.id,
        average_processing_time: op.averageProcessingTime,
        backup_id: newBackupId,
      }

      if(op.id && op.id > 0 && !backupName) {
        // update
        await Model.models.ContentieuxOptions.updateById(op.id, options)
      } else {
        // create
        const newOp = await Model.models.ContentieuxOptions.create(options)
        op.id = newOp.dataValues.id
      }

      reelIds.push(op.id)
    }

    // remove old
    const oldNewList = (await Model.models.ContentieuxOptions.findAll({
      attributes: ['id'],
      where: {
        backup_id: newBackupId,
      },
      raw: true,
    })).map(h => (h.id))
    for(let i = 0; i < oldNewList.length; i++) {
      if(reelIds.indexOf(oldNewList[i]) === -1) {
        await Model.models.ContentieuxOptions.destroyById(oldNewList[i])
      }
    }

    return newBackupId
  }

  Model.haveAccess = async (optionBackupId, juridictionId, userId) => {
    const find = await Model.findOne({
      where: {
        id: optionBackupId,
      },
      include: [{
        model: Model.models.OptionsBackupJuridictions,
        required: true,
        where: {
          juridiction_id: juridictionId,
        },
        include: [{ 
          model: Model.models.UserVentilations,
          required: true,
          where: {
            user_id: userId,
          },
        }],
      }],
    })

    return find ? true : false
  }

  Model.adminGetAll = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'label'], 
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        label: list[i].label,
        juridictions: (await Model.models.OptionsBackupJuridictions.findAll({
          attributes: ['juridiction_id'],
          where: {
            option_backup_id: list[i].id, 
          },
          raw: true,
        })).map(h => (h.juridiction_id)),
      }
    }

    return list
  }

  return Model
}