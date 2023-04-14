/**
 * Liste des juridctions auquels ont accès les utilisateur
 */

export default (sequelizeInstance, Model) => {
  /**
   * List des juridictions affectés d'un utilisateur
   * @param {*} userId
   * @returns
   */
  Model.list = async (userId) => {
    const listAll = await Model.findAll({
      attributes: ['id', 'label', ['updated_at', 'date']],
      include: [
        {
          attributes: ['id'],
          model: Model.models.UserVentilations,
          where: {
            user_id: userId,
          },
        },
      ],
      order: [['label', 'asc']],
      raw: true,
    })
    const list = []

    for (let i = 0; i < listAll.length; i++) {
      if (await Model.models.TJ.isVisible(listAll[i].label)) {
        list.push({
          id: listAll[i].id,
          label: listAll[i].label,
          date: listAll[i].date,
        })
      }
    }

    return list
  }

  /**
   * Suppression d'une juridiciton
   * @param {*} backupId
   */
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

  /**
   * Copie d'un juridicition
   * @param {*} backupId
   * @param {*} backupName
   * @returns
   */
  Model.duplicateBackup = async (backupId, backupName) => {
    const backup = await Model.findOne({
      where: {
        id: backupId,
      },
      raw: true,
    })

    if (backup) {
      delete backup.id
      const backupCreated = await Model.create({ ...backup, label: backupName })
      const newBackupId = backupCreated.dataValues.id

      const hrList = await Model.models.HumanResources.findAll({
        where: {
          backup_id: backupId,
        },
        raw: true,
      })
      for (let x = 0; x < hrList.length; x++) {
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
        for (let x = 0; x < ventilationsList.length; x++) {
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

  /**
   * Liste des juridictions
   * @returns
   */
  Model.getAll = async () => {
    const listAll = await Model.findAll({
      attributes: ['id', 'label', ['created_at', 'date']],
      raw: true,
    })
    const list = []

    for (let i = 0; i < listAll.length; i++) {
      if (await Model.models.TJ.isVisible(listAll[i].label)) {
        list.push({
          id: listAll[i].id,
          label: listAll[i].label,
          date: listAll[i].date,
        })
      }
    }

    return list
  }

  /**
   * Control pour savoir si un utilisateur a accès à une juridiction id
   * @param {*} id
   * @param {*} userId
   * @returns
   */
  Model.haveAccess = async (id, userId) => {
    const hr = await Model.findOne({
      where: {
        id,
      },
      attributes: ['id', 'label'],
      include: [
        {
          attributes: ['id'],
          model: Model.models.UserVentilations,
          required: true,
          where: {
            user_id: userId,
          },
        },
      ],
      raw: true,
    })

    return hr && (await Model.models.TJ.isVisible(hr.label)) ? true : false
  }

  /**
   * Création ou récupération d'une juridiction par son nom
   * @param {*} juridictionName
   * @returns
   */
  Model.findOrCreateLabel = async (juridictionName) => {
    const find = await Model.findOne({
      attributes: ['id'],
      where: {
        label: juridictionName,
      },
      raw: true,
    })

    if (!find) {
      const newElement = await Model.create({
        label: juridictionName,
      })
      return newElement.dataValues.id
    }

    return find.id
  }

  /**
   * Récupération d'une juridiction par son nom
   * @param {*} juridictionName
   * @returns
   */
  Model.findByLabel = async (juridictionName) => {
    const find = await Model.findOne({
      attributes: ['id'],
      where: {
        label: juridictionName,
      },
      raw: true,
    })

    if (!find) {
      return null
    }

    return find.id
  }

  /**
   * Récupération d'une juridiction par son id
   * @param {*} id
   * @returns
   */
  Model.findById = async (id) => {
    const find = await Model.findOne({
      attributes: ['label'],
      where: { id },
      raw: true,
    })

    if (!find) {
      return null
    }

    return find.label
  }

  return Model
}
