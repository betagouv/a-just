export default (sequelizeInstance, Model) => {
  Model.changeRules = async (backupId, juridictions) => {
    await Model.destroy({
      where: {
        option_backup_id: backupId,
      },
      force: true,
    })

    for(let i = 0; i < juridictions.length; i++) {
      await Model.create({
        option_backup_id: backupId,
        juridiction_id: juridictions[i],
      })
    }
  }

  return Model
}
