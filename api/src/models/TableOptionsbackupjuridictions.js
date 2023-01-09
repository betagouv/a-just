/**
 * Défini si un temps moyen est accèssible à une juridction
 */

export default (sequelizeInstance, Model) => {
  /**
   * Ajoute un accès à une juridicition
   * @param {*} backupId
   * @param {*} juridictions
   */
  Model.changeRules = async (backupId, juridictions) => {
    await Model.destroy({
      where: {
        option_backup_id: backupId,
      },
      force: true,
    })

    for (let i = 0; i < juridictions.length; i++) {
      await Model.create({
        option_backup_id: backupId,
        juridiction_id: juridictions[i],
      })
    }
  }

  return Model
}
