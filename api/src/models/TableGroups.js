/**
 * Gestion des groupes
 */
import { Op } from 'sequelize'
import { orderBy } from 'lodash'

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

  /**
   * Liste des groupes de juridictions accessibles à un utilisateur,
   * ainsi que ses juridictions qui n'appartiennent à aucun groupe
   * @param {*} userId
   * @returns
   */
  Model.listGroupsForUser = async (userId) => {
    const adminLocalIds = await Model.models.Users.getUserAdminLocal(userId)
    const backups = (await Model.models.HRBackups.list(userId)).map((backup) => ({
      ...backup,
      isAdminLocal: adminLocalIds.includes(backup.id),
    }))

    const groupsById = new Map()
    const backupsWithoutGroup = []

    backups.forEach((backup) => {
      const group = (backup.groups || [])[0]

      if (!group) {
        backupsWithoutGroup.push(backup)
        return
      }

      if (!groupsById.has(group.id)) {
        groupsById.set(group.id, { id: group.id, label: group.label, backups: [] })
      }

      groupsById.get(group.id).backups.push(backup)
    })

    return {
      groups: orderBy(
        Array.from(groupsById.values()).map((group) => ({
          ...group,
          backups: orderBy(group.backups, ['groupIdRank', 'label']),
        })),
        'label',
      ),
      backupsWithoutGroup: orderBy(backupsWithoutGroup, 'label'),
    }
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

  Model.getGroupsByBackupId = async (backupId, userId) => {
    // récupére le groupe de la juridition
    const backup = await Model.models.HRBackups.findOne({ where: { id: backupId }, raw: true })

    if (!backup) {
      return null
    }

    // on récupère le contenu du groupe
    const group = await Model.findOne({ where: { id: backup.group_id }, raw: true })
    if (!group) {
      return null
    }

    // on récupère les juridictions du groupe
    const backups = await Model.models.HRBackups.findAll({
      attributes: ['id', 'label', 'group_id', 'group_id_rank'],
      where: {
        group_id: backup.group_id,
      },
      order: [
        ['group_id_rank', 'ASC'],
        ['label', 'ASC'],
      ],
      raw: true,
    })

    return {
      id: group.id,
      label: group.label,
      backups: backups.map((backup) => ({ id: backup.id, label: backup.label })),
    }
  }

  return Model
}
