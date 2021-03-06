import { Op } from 'sequelize'

export default (sequelizeInstance, Model) => {
  Model.lastId = async () => {
    const lastBackup = await Model.findAll({
      order: [['id', 'desc']],
      limit: 1,
    })

    return lastBackup.length ? lastBackup[0].dataValues.id : null
  }

  Model.list = async (userId) => {
    const list = await Model.findAll({
      attributes: ['id', 'label', ['updated_at', 'date']],
      include: [{
        attributes: ['id'],
        model: Model.models.UserVentilations,
        where: {
          user_id: userId,
        },
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

    await Model.models.HumanResources.destroy({
      where: {
        backup_id: backupId,
      },
    })
  }

  Model.duplicateBackup = async (backupId, backupName) => {
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

  Model.saveBackup = async (list, backupId, backupName) => {
    let newBackupId = backupId
    let reelHRIds = []
    // if backup name create a copy
    if(backupName) {
      const newBackup = await Model.create({
        label: backupName,
      })
      newBackupId = newBackup.dataValues.id
    }

    for(let x = 0; x < list.length; x++) {
      const hr = list[x]

      const options = {
        first_name: hr.firstName || null,
        last_name: hr.lastName || null,
        date_entree: hr.dateStart || null,
        date_sortie: hr.dateEnd || null,
        note: hr.note,
        backup_id: newBackupId,
      }

      if(hr.id && hr.id > 0 && !backupName) {
        // update
        await Model.models.HumanResources.updateById(hr.id, options)

        // delete force all references
        await Model.models.HRVentilations.destroy({
          where: {
            rh_id: hr.id,
          },
          force: true,
        })
      } else {
        // create
        const newHr = await Model.models.HumanResources.create(options)
        hr.id = newHr.dataValues.id
      }

      reelHRIds.push(hr.id)

      for(let i = 0; i < hr.activities.length; i++) {
        // add activities
        const activity = hr.activities[i]
        if(activity.percent) {
          if(!activity.referentielId) {
            // find referentiel id
            activity.referentielId = await Model.models.ContentieuxReferentiels.getContentieuxId(activity.label) 
          }

          await Model.models.HRVentilations.create({
            backup_id: newBackupId,
            rh_id: hr.id,
            percent: activity.percent,
            nac_id: activity.referentielId,
            date_start: activity.dateStart,
            date_stop: activity.dateStop,
          })
        }
      }

      await Model.models.HRSituations.syncSituations(hr.situations, hr.id)
    }

    // remove old HR
    const oldNewHRList = (await Model.models.HumanResources.findAll({
      attributes: ['id'],
      where: {
        backup_id: newBackupId,
        id: {
          [Op.notIn]: reelHRIds,
        },
      },
      raw: true,
    })).map(h => (h.id))
    for(let i = 0; i < oldNewHRList.length; i++) {
      await Model.models.HumanResources.destroyById(oldNewHRList[i])
    }

    // update date of backup
    await Model.updateById(newBackupId, {
      updated_at: new Date(),
    })

    return newBackupId
  }

  Model.getAll = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'label', ['created_at', 'date']],
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

  Model.haveAccess = async (id, userId) => {
    const hr = await Model.findOne({
      where: {
        id,
      },
      attributes: ['id'],
      model: Model.models.HRBackups,
      include: [{
        attributes: ['id'],
        model: Model.models.UserVentilations,
        required: true,
        where: {
          user_id: userId,
        },
      }],
      raw: true,
    })

    return hr ? true : false
  }

  Model.findOrCreateLabel = async (juridictionName) => {
    const find = await Model.findOne({
      attributes: ['id'],
      where: {
        label: juridictionName,
      },
      raw: true,
    })

    if(!find) {
      const newElement = await Model.create({
        label: juridictionName,
      })
      return newElement.dataValues.id
    }

    return find.id
  }

  return Model
}