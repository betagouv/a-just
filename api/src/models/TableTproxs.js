/**
 * Notifications center
 */

export default (sequelizeInstance, Model) => {
  /**
   * Retourne la totalité des Tprox
   * @returns
   */
  Model.getByTj = async (tj) => {
    const list = await Model.findAll({
      attributes: ['id', 'tj', 'tprox'],
      where: { tj: tj },
      raw: true,
    })

    return list
  }

  /**
   * Ajoute une ligne de qui sauvegarde qui à modifié un temps moyens par dossier
   * @param {*} userId
   * @param {*} backupId
   */
  Model.addTprox = async (tj, tprox) => {
    await Model.create({
      tj: tj,
      tprox: tprox,
    })
  }

  return Model
}
