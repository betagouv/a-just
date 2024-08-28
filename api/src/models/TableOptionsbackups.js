/**
 * Liste des options d'une juridiction
 */

import { BACKUP_SETTING_COMPARE } from '../constants/backup-settings'

export default (sequelizeInstance, Model) => {
  /**
   * Liste des sauvegardes
   * @param {*} userId
   * @param {*} juridictionId
   * @returns
   */
  Model.getBackup = async (userId, juridictionId) => {
    const list = await Model.findAll({
      attributes: ['id', 'label', ['created_at', 'date'], 'type', 'status', 'user_id'],
      include: [
        {
          attributes: ['id', 'first_name', 'last_name'],
          model: Model.models.Users,
        },
        {
          model: Model.models.OptionsBackupJuridictions,
          required: true,
          where: {
            juridiction_id: juridictionId,
          },
          include: [
            {
              model: Model.models.UserVentilations,
              required: true,
              where: {
                user_id: userId,
              },
            },
          ],
        },
      ],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      const lastUpdate = await Model.models.HistoriesContentieuxUpdate.getLastUpdate(list[i].id)
      let user = null
      if (list[i]['User.first_name'] && list[i]['User.last_name']) user = list[i]['User.first_name'] + ' ' + list[i]['User.last_name']
      list[i] = {
        id: list[i].id,
        label: list[i].label,
        date: list[i].date,
        type: list[i].type,
        status: list[i].status,
        update: lastUpdate,
        userId: list[i].user_id,
        userName: user,
      }
    }

    return list
  }

  /**
   * Suppression d'une sauvegarde
   * @param {*} backupId
   */
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

    await Model.models.OptionsBackupJuridictions.destroy({
      where: {
        option_backup_id: backupId,
      },
    })

    const settings = await Model.models.HRBackupsSettings.list(null, [BACKUP_SETTING_COMPARE])
    for (let i = 0; i < settings.length; i++) {
      const datas = settings[i].datas
      if (datas.referentielId && datas.referentielId === backupId) {
        await Model.models.HRBackupsSettings.removeSetting(settings[i].id)
      }
    }
  }

  /**
   * Copie d'une sauvegarde
   * @param {*} backupId
   * @param {*} backupName
   * @param {*} juridictionId
   * @returns
   */
  Model.duplicateBackup = async (userId, backupId, backupName, juridictionId, status, type) => {
    const backup = await Model.findOne({
      where: {
        id: backupId,
      },
      raw: true,
    })

    if (backup) {
      delete backup.id
      const backupCreated = await Model.create({ label: backupName, status, type, created_at: new Date(), user_id: userId })
      const newBackupId = backupCreated.dataValues.id

      const hrList = await Model.models.ContentieuxOptions.findAll({
        where: {
          backup_id: backupId,
        },
        raw: true,
      })
      for (let x = 0; x < hrList.length; x++) {
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

  /**
   * Sauvegarde des temps moyens à une juridictions
   * @param {*} list
   * @param {*} backupId
   * @param {*} backupName
   * @param {*} juridictionId
   * @returns
   */
  Model.saveBackup = async (userId, list, backupId, backupName, juridictionId, backupStatus = 'Local', type) => {
    let newBackupId = backupId
    let reelIds = []
    // if backup name create a copy
    if (backupName) {
      const newBackup = await Model.create({
        label: backupName,
        type,
        status: backupStatus,
        user_id: userId,
      })
      newBackupId = newBackup.dataValues.id
      await Model.models.OptionsBackupJuridictions.create({
        option_backup_id: newBackupId,
        juridiction_id: juridictionId,
      })
    }
    for (let x = 0; x < list.length; x++) {
      const op = list[x]

      const options = {
        contentieux_id: op.contentieux.id,
        average_processing_time: op.averageProcessingTime,
        backup_id: newBackupId,
      }

      if (op.id && op.id > 0 && !backupName) {
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
    const oldNewList = (
      await Model.models.ContentieuxOptions.findAll({
        attributes: ['id'],
        where: {
          backup_id: newBackupId,
        },
        raw: true,
      })
    ).map((h) => h.id)
    for (let i = 0; i < oldNewList.length; i++) {
      if (reelIds.indexOf(oldNewList[i]) === -1) {
        await Model.models.ContentieuxOptions.destroyById(oldNewList[i])
      }
    }

    return newBackupId
  }

  /**
   * Renomme une sauvegarde
   * @param {*} backupId
   * @param {*} backupName
   */
  Model.renameBackup = async (backupId, backupName) => {
    const backup = await Model.findOne({
      where: {
        id: backupId,
      },
    })

    if (backup) {
      await backup.update({
        label: backupName,
      })
    }
  }

  /**
   * Vérifier si une utilisateur à accès a une sauvegarde
   * @param {*} optionBackupId
   * @param {*} juridictionId
   * @param {*} userId
   * @returns
   */
  Model.haveAccess = async (optionBackupId, juridictionId, userId) => {
    const find = await Model.findOne({
      where: {
        id: optionBackupId,
      },
      include: [
        {
          model: Model.models.OptionsBackupJuridictions,
          required: true,
          where: {
            juridiction_id: juridictionId,
          },
          include: [
            {
              model: Model.models.UserVentilations,
              required: true,
              where: {
                user_id: userId,
              },
            },
          ],
        },
      ],
    })

    return find ? true : false
  }

  /**
   * Control si un utilisateur sur les sauvegarde
   * @param {*} optionBackupId
   * @param {*} userId
   * @returns
   */
  Model.haveAccessWithoutJuridiction = async (optionBackupId, userId) => {
    const find = await Model.findOne({
      where: {
        id: optionBackupId,
      },
      include: [
        {
          model: Model.models.OptionsBackupJuridictions,
          required: true,
          include: [
            {
              model: Model.models.UserVentilations,
              required: true,
              where: {
                user_id: userId,
              },
            },
          ],
        },
      ],
    })

    return find ? true : false
  }

  /**
   * Retourne de l'enssemble des sauvegardes
   * @returns
   */
  Model.adminGetAll = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'label'],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        label: list[i].label,
        juridictions: (
          await Model.models.OptionsBackupJuridictions.findAll({
            attributes: ['juridiction_id'],
            where: {
              option_backup_id: list[i].id,
            },
            raw: true,
          })
        ).map((h) => h.juridiction_id),
      }
    }

    return list
  }

  return Model
}
