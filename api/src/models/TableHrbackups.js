import { Op } from 'sequelize'
import { USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN, USER_ROLE_TEAM } from '../constants/roles'
import { orderBy } from 'lodash'
import { isTj } from '../utils/ca'

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
      attributes: ['id', 'label', ['updated_at', 'date'], 'jirs', 'stat_exclusion'],
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
          jirs: listAll[i].jirs,
          stat_exclusion: listAll[i].stat_exclusion,
        })
      }
    }
    return list
  }

  /**
   * Suppression d'une juridiction
   * @param {*} backupId
   */
  Model.removeBackup = async (backupId) => {
    const backup = await Model.findOne({
      where: {
        id: backupId,
      },
      raw: true,
    })

    if (backup) {
      let hrList = await Model.models.HumanResources.findAll({
        where: {
          backup_id: backupId,
        },
        raw: true,
      })

      for (let x = 0; x < hrList.length; x++) {
        const hrId = hrList[x].id
        await Model.models.HRSituations.destroy({
          where: { human_id: hrId },
        })

        await Model.models.HRIndisponibilities.destroy({
          where: { hr_id: hrId },
        })
      }

      await Model.models.HumanResources.destroy({
        where: {
          backup_id: backupId,
        },
      })

      await Model.models.Activities.destroy({
        where: {
          hr_backup_id: backupId,
        },
      })

      await Model.models.UserVentilations.destroy({
        where: {
          hr_backup_id: backupId,
        },
      })

      await Model.destroy({
        where: {
          id: backupId,
        },
      })
    }
  }

  /**
   * Copie d'un juridicition
   * @param {*} backupId
   * @param {*} backupName
   * @returns
   */
  Model.duplicateBackup = async (backupId, backupName, copyAct = false, statExclusion = false) => {
    const backup = await Model.findOne({
      where: {
        id: backupId,
      },
      raw: true,
    })

    if (backup) {
      // Creation d'un BACKUP
      delete backup.id
      const backupCreated = await Model.create({
        ...backup,
        label: backupName,
        stat_exclusion: statExclusion,
      })
      const newBackupId = backupCreated.dataValues.id

      // Création d'un TJ ou CA IELST
      const tjCreated = await models.TJ.create({
        i_elst: 0,
        label: backupName,
        latitude: 0,
        longitude: 0,
        population: 0,
        enabled: true,
        type: 'TGI',
      })

      const newTJId = tjCreated.dataValues.id

      if (isTj()) {
        let subJuridictions = null
        let tj = null
        const attributes = ['id', 'i_elst', 'label', 'type', 'parent_id']
        tj = await models.TJ.findOne({
          attributes,
          where: {
            label: backup.label,
          },
          raw: true,
        })

        if (tj) {
          subJuridictions = await models.TJ.findAll({
            attributes,
            where: {
              parent_id: tj.id,
            },
            raw: true,
          })

          for (let i = 0; i < subJuridictions.length; i++) {
            await models.TJ.create({
              i_elst: 0,
              label: subJuridictions[i]['type'] + ' ' + i,
              latitude: 0,
              longitude: 0,
              population: 0,
              enabled: false,
              type: subJuridictions[i]['type'],
              parent_id: newTJId,
            })
          }
        }
      }

      // Recherche de HR
      let hrList = await Model.models.HumanResources.findAll({
        where: {
          backup_id: backupId,
        },
        raw: true,
      })

      hrList = orderBy(hrList, 'last_name')

      for (let x = 0; x < hrList.length; x++) {
        // Pour chaque HR
        const hrId = hrList[x].id
        delete hrList[x].id
        delete hrList[x]['first_name']
        delete hrList[x]['last_name']
        delete hrList[x]['juridiction']

        // Création de HR
        const newHR = await Model.models.HumanResources.create({
          ...hrList[x],
          first_name: '',
          last_name: x,
          backup_id: newBackupId,
        })

        // Recherche de situation pour chaque HR
        const situationList = await Model.models.HRSituations.findAll({
          where: {
            human_id: hrId,
          },
          raw: true,
        })

        for (let y = 0; y < situationList.length; y++) {
          // Pour chaque situation
          const situationId = situationList[y].id
          delete situationList[y].id

          let category = await models.HRCategories.findOne({
            where: {
              id: situationList[y]['category_id'],
            },
          })

          // Renommer la HR si pas magistrat
          if (category) await newHR.update({ first_name: category.dataValues.label })

          // Création d'une situation
          const newSituation = await Model.models.HRSituations.create({
            ...situationList[y],
            human_id: newHR.dataValues.id,
          })

          // Recherche de ventilation dans chaque situation
          const ventilationList = await Model.models.HRActivities.findAll({
            where: {
              hr_situation_id: situationId,
            },
            raw: true,
          })

          for (let z = 0; z < ventilationList.length; z++) {
            // Pour chaque ventilation
            delete ventilationList[z].id

            // Création d'une ventilation
            await Model.models.HRActivities.create({
              ...ventilationList[z],
              hr_situation_id: newSituation.dataValues.id,
            })
          }
        }
        // Recherche d'indispo
        const indispoList = await Model.models.HRIndisponibilities.findAll({
          where: {
            hr_id: hrId,
          },
          raw: true,
        })

        for (let y = 0; y < indispoList.length; y++) {
          // Pour chaque indispo
          delete indispoList[y].id

          // Création d'une indispo
          await Model.models.HRIndisponibilities.create({
            ...indispoList[y],
            hr_id: newHR.dataValues.id,
          })
        }
      }

      if (copyAct) {
        const activities = await Model.models.Activities.findAll({
          where: {
            hr_backup_id: backupId,
          },
          raw: true,
        })
        for (let w = 0; w < activities.length; w++) {
          delete activities[w].id
          await Model.models.Activities.create({
            ...activities[w],
            hr_backup_id: newBackupId,
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
      order: [['label', 'asc']],
      raw: true,
    })
    const list = []
    for (let i = 0; i < listAll.length; i++) {
      list.push({
        id: listAll[i].id,
        label: listAll[i].label,
        date: listAll[i].date,
        groups: await Model.models.HRBackupsGroupsIds.getGroupsByBackupId(listAll[i].id),
      })
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
  Model.findOrCreateLabel = async (juridictionName, backupId = null, newLabel = null) => {
    let find = null
    if (backupId) {
      find = await Model.findOne({
        where: {
          id: backupId,
        },
      })
    } else {
      find = await Model.findOne({
        attributes: ['id'],
        where: {
          label: juridictionName,
        },
      })
    }

    if (!find) {
      const newElement = await Model.create({
        label: newLabel || juridictionName,
      })
      return newElement.dataValues.id
    } else {
      await find.update({
        label: newLabel || juridictionName,
      })
    }

    return find.dataValues.id
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
      attributes: ['label', 'jirs'],
      where: { id },
      raw: true,
    })

    if (!find) {
      return null
    }

    return find.label
  }

  /**
   * Ajouter les accès aux membres de l'équipe à la juridiction lors de la création d'une juridiction
   * @param {*} juridicitionId
   */
  Model.addUserAccessToTeam = async (juridicitionId) => {
    const usersAffected = (
      await Model.models.UserVentilations.findAll({
        where: {
          hr_backup_id: juridicitionId,
        },
        raw: true,
      })
    ).map((s) => s.user_id)

    const users = await Model.models.Users.findAll({
      where: {
        role: [USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN, USER_ROLE_TEAM],
        id: {
          [Op.notIn]: usersAffected,
        },
      },
      raw: true,
    })

    for (let i = 0; i < users.length; i++) {
      await Model.models.UserVentilations.pushVentilation(users[i].id, juridicitionId)
    }
  }

  return Model
}
