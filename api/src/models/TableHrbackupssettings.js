/**
 * Options d'un backup
 */

import { Op } from 'sequelize'

export default (sequelizeInstance, Model) => {
  /**
   * Mise à jour options d'un backup
   * @param {*} id
   * @param {*} backupId
   * @param {*} label
   * @param {*} type
   * @param {*} datas
   * @returns
   */
  Model.addOrUpdate = async (id, backupId, label, type, datas) => {
    if (label) {
      const find = await Model.findOne({
        where: {
          backup_id: backupId,
          label,
          type,
        },
      })

      if (find) {
        await find.update({
          updated_at: new Date(),
        })
        return
      }
    }

    if (id) {
      const find = await Model.findOne({
        where: {
          backup_id: backupId,
          id,
        },
      })

      if (find) {
        await find.update({
          type,
          label,
          datas: JSON.stringify(datas),
        })
        return
      }
    }

    await Model.create({
      type,
      label,
      backup_id: backupId,
      datas: JSON.stringify(datas),
    })
  }

  /**
   * Liste des options d'un backup
   * @param {*} backupId
   * @param {*} types
   * @returns
   */
  Model.list = async (backupId, types, userId) => {
    const whereOptions = {}
    if (types) {
      whereOptions.type = types
    }
    if (backupId) {
      whereOptions.backup_id = backupId
    }
    if (userId && !(await Model.models.Users.canViewCompleteReferentiel(userId))) {
      whereOptions.datas = {
        [Op.notLike]: `%referentielId%`,
      }
    }

    const findAll = await Model.findAll({
      attributes: ['id', 'label', 'type', 'datas', ['created_at', 'createdAt'], ['updated_at', 'updatedAt']],
      where: {
        ...whereOptions,
      },
      order: [['updatedAt', 'DESC']],
      raw: true,
    })

    for (let i = 0; i < findAll.length; i++) {
      findAll[i] = {
        ...findAll[i],
        datas: JSON.parse(findAll[i].datas),
      }
    }

    return findAll
  }

  /**
   * Remove option backup
   * @param {*} id
   * @returns
   */
  Model.removeSetting = async (id, userId) => {
    const findOne = await Model.findOne({
      where: {
        id,
      },
      raw: true,
    })

    if (!findOne || (userId && !(await Model.models.HRBackups.haveAccess(findOne.backup_id, userId)))) {
      throw "Vous n'avez pas accès à cette juridiction !"
    }

    await Model.destroyById(id)
  }

  return Model
}
