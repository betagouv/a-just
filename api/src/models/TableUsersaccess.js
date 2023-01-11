/**
 * Liste des acces aux pages des utilisateurs
 */

export default (sequelizeInstance, Model) => {
  /**
   * Liste des accès d'un utilisateur
   * @param {*} userId
   * @returns
   */
  Model.getUserAccess = async (userId) => {
    const access = await Model.findAll({
      attributes: ['access_id'],
      where: { user_id: userId },
      raw: true,
    })

    return access.map((a) => a.access_id)
  }

  /**
   * Mise à jours des accès à un utilisateur
   * @param {*} userId
   * @param {*} accessIds
   */
  Model.updateAccess = async (userId, accessIds) => {
    await Model.destroy({
      where: {
        user_id: userId,
      },
      force: true,
    })

    for (let i = 0; i < accessIds.length; i++) {
      await Model.create({
        user_id: userId,
        access_id: accessIds[i],
      })
    }
  }

  return Model
}
