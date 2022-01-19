export default (sequelizeInstance, Model) => {
  Model.createWithLabel = async (label, juridictionName) => {
    let jurdiction = await Model.models.Juridictions.findOne({
      where: {
        label: juridictionName,
      },
    })

    if(!jurdiction) {
      jurdiction = await Model.models.Juridictions.create({
        label: juridictionName,
        cour_appel: juridictionName,
      })
    }

    const creation = await Model.create({
      label,
      juridiction_id: jurdiction.dataValues.id,
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

  Model.list = async (userId) => {
    const list = await Model.findAll({
      attributes: ['id', 'label', ['updated_at', 'date'], 'juridiction_id'],
      include: [{
        attributes: ['id', 'label', 'cour_appel', 'long_name', 'image_url'],
        model: Model.models.Juridictions,
        required: true,
        include: [{
          attributes: ['id'],
          model: Model.models.UserJuridictions,
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
        juridiction: {
          id: list[i]['Juridiction.id'],
          label: list[i]['Juridiction.label'],
          courAppel: list[i]['Juridiction.cour_appel'],
          longName: list[i]['Juridiction.long_name'],
          imageUrl: list[i]['Juridiction.image_url'],
        },
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

  Model.saveBackup = async (list, backupId, backupName, juridictionId) => {
    let newBackupId = backupId
    let reelHRIds = []
    // if backup name create a copy
    if(backupName) {
      const newBackup = await Model.create({
        label: backupName,
        juridiction_id: juridictionId,
      })
      newBackupId = newBackup.dataValues.id
    }

    for(let x = 0; x < list.length; x++) {
      const hr = list[x]

      const options = {
        etp: hr.etp || 0,
        posad: hr.posad || 0,
        first_name: hr.firstName || null,
        last_name: hr.lastName || null,
        date_entree: hr.dateStart || null,
        date_sortie: hr.dateEnd || null,
        note: hr.note,
        backup_id: newBackupId,
        hr_categorie_id: hr.category && hr.category.id ? hr.category.id : null,
        hr_fonction_id: hr.fonction && hr.fonction.id ? hr.fonction.id : null,
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
    }

    // remove old HR
    const oldNewHRList = (await Model.models.HumanResources.findAll({
      attributes: ['id'],
      where: {
        backup_id: newBackupId,
      },
      raw: true,
    })).map(h => (h.id))
    for(let i = 0; i < oldNewHRList.length; i++) {
      if(reelHRIds.indexOf(oldNewHRList[i]) === -1) {
        await Model.models.HumanResources.destroyById(oldNewHRList[i])
      }
    }

    // update date of backup
    await Model.updateById(newBackupId, {
      updated_at: new Date(),
    })

    return newBackupId
  }

  Model.getAll = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'label', ['created_at', 'date'], 'juridiction_id'],
      include: [{
        attributes: ['label', 'cour_appel'],
        model: Model.models.Juridictions,
        required: true,
      }],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        label: list[i].label,
        date: list[i].date,
        juridiction: {
          label: list[i]['Juridiction.label'],
          courAppel: list[i]['Juridiction.cour_appel'],
        },
      }
    }

    return list
  }

  return Model
}