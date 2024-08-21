/**
 * Options d'un backup
 */

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
  Model.list = async (backupId, types) => {
    const whereOptions = {}
    if (types) {
      whereOptions.type = types
    }

    const findAll = await Model.findAll({
      attributes: ['id', 'label', 'type', 'datas', ['created_at', 'createdAt'], ['updated_at', 'updatedAt']],
      where: {
        backup_id: backupId,
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

    if (!findOne || !(await Model.models.HRBackups.haveAccess(findOne.backup_id, userId))) {
      throw "Vous n'avez pas accès à cette juridiction !"
    }

    await Model.destroyById(id)
  }

  return Model
}
