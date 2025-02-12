/**
 * Liste des liens entre les groupes et les jurdictions
 */

export default (sequelizeInstance, Model) => {
  Model.getGroupsByBackupId = async (hrBackupId) => {
    const list = await Model.findAll({
      attributes: ['id', 'hr_backup_group_id', 'hr_backup_id'],
      where: {
        hr_backup_id: hrBackupId,
      },
      include: [{
        attributes: ['label'],
        model: Model.models.HRBackupsGroups,
      }],
      raw: true,
    })

    for(let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].hr_backup_group_id,
        label: list[i]['HRBackupsGroup.label'],
      }
    }

    return list
  }
  

  return Model
}
