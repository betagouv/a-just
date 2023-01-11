/**
 * Intermédiaire avec la table d'historisation des modifications d'activités
 */
export default (sequelizeInstance, Model) => {
  /**
   * Ajoute une ligne lors d'une modification de valeur des activités
   * @param {*} userId
   * @param {*} activityId
   * @param {*} nodeUpdated
   * @param {*} value
   */
  Model.addHistory = async (userId, activityId, nodeUpdated, value) => {
    await Model.create({
      activity_id: activityId,
      user_id: userId,
      activity_node_updated: nodeUpdated,
      value,
    })
  }

  /**
   * Retourne la date de dernière mise à jours d'une liste de contentieux
   * @param {*} listId
   * @returns
   */
  Model.getLastUpdate = async (listId) => {
    const listUpdated = await Model.findAll({
      attributes: ['user_id', 'updated_at'],
      where: {
        activity_id: listId,
      },
      include: [
        {
          model: Model.models.Users,
          attributes: ['first_name', 'last_name'],
        },
      ],
      order: [['updated_at', 'desc']],
      limit: 1,
      raw: true,
    })

    if (listUpdated.length > 0) {
      return {
        user: {
          firstName: listUpdated[0]['User.first_name'],
          lastName: listUpdated[0]['User.last_name'],
        },
        date: listUpdated[0].updated_at,
      }
    }

    return null
  }

  /**
   * Retourne qui a modifié en dernier un type (entrées, sorties, stock) d'une activité
   * @param {*} activityId
   * @param {*} nodeUpdated
   * @returns
   */
  Model.getLastUpdateByActivityAndNode = async (activityId, nodeUpdated) => {
    const listUpdated = await Model.findAll({
      attributes: ['user_id', 'updated_at', 'value'],
      where: {
        activity_id: activityId,
        activity_node_updated: nodeUpdated,
      },
      include: [
        {
          model: Model.models.Users,
          attributes: ['first_name', 'last_name'],
        },
      ],
      order: [['updated_at', 'desc']],
      limit: 1,
      raw: true,
    })

    if (listUpdated.length > 0) {
      return {
        user: {
          firstName: listUpdated[0]['User.first_name'],
          lastName: listUpdated[0]['User.last_name'],
        },
        value: listUpdated[0].value,
        date: listUpdated[0].updated_at,
      }
    }

    return null
  }

  return Model
}
