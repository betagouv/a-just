/**
 * Gestion des groupes
 */
import { Op } from 'sequelize'

export default (sequelizeInstance, Model) => {
  /**
   * Récupération de la liste des groupes
   * @returns
   */
  Model.listGroups = async () => {
    const groups = await Model.findAll({
      attributes: ['id', 'label'],
      order: [['label', 'ASC']],
      raw: true,
    })

    const backups = await Model.models.HRBackups.findAll({
      attributes: ['id', 'label', 'group_id', 'group_id_rank'],
      where: {
        group_id: { [Op.ne]: null },
      },
      order: [
        ['group_id_rank', 'ASC'],
        ['label', 'ASC'],
      ],
      raw: true,
    })

    return groups.map((group) => ({
      id: group.id,
      label: group.label,
      backups: backups
        .filter((backup) => backup.group_id === group.id)
        .map((backup) => ({ id: backup.id, label: backup.label })),
    }))
  }

  Model.listHrbackupAlone = async () => {
    const hrbackupAlone = await Model.models.HRBackups.findAll({
      attributes: ['id', 'label'],
      where: {
        group_id: null,
      },
      order: [
        ['group_id_rank', 'ASC'],
        ['label', 'ASC'],
      ],
      raw: true,
    })

    return hrbackupAlone
  }

  Model.assignHrBackups = async (groupId, backupIds) => {
    for (let i = 0; i < backupIds.length; i++) {
      await Model.models.HRBackups.update(
        {
          group_id: groupId,
          group_id_rank: i,
        },
        { where: { id: backupIds[i] } },
      )
    }
  }

  Model.createGroup = async (label) => {
    const group = await Model.create({ label })
    return { id: group.id, label: group.label, backups: [] }
  }

  Model.updateGroup = async (groupId, label) => {
    const group = await Model.findOne({ where: { id: groupId } })
    if (!group) {
      return null
    }
    await group.update({ label })
    return true
  }

  Model.removeGroup = async (groupId) => {
    await Model.models.HRBackups.update(
      {
        group_id: null,
        group_id_rank: null,
      },
      { where: { group_id: groupId } },
    )

    const group = await Model.findOne({ where: { id: groupId } })
    if (group) {
      await group.destroy()
    }

    return true
  }

  Model.getGroupsByJuridictionId = async (juridictionId) => {
    /*const groups = await Model.findAll({
      attributes: ['id', 'label'],
      where: { juridiction_id: juridictionId },
      raw: true,
    })
    console.log('groups', groups);
    return groups*/
    return []
  }

  return Model
}
