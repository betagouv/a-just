import { Op } from 'sequelize'

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
        value: {
          [Op.ne]: null,
        },
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

  /**
   * Retourne la date du dernière stock pour une juridiction
   * @param {*} HRBackupId
   * @returns
   */
  Model.getLasHumanActivites = async (HRBackupId) => {
    const referentiel = (await Model.models.ContentieuxReferentiels.getReferentiels()) || []

    const getHistory = async (historyId = null, activityDate = null, contentieuxId = null) => {
      const whereActivity = {
        hr_backup_id: HRBackupId,
      }
      const whereHistory = {}

      if (historyId) {
        whereHistory.id = {
          [Op.lt]: historyId,
        }
      }

      if (activityDate) {
        whereActivity.periode = {
          [Op.ne]: activityDate,
        }
      }

      if (contentieuxId) {
        whereActivity.contentieux_id = {
          [Op.ne]: contentieuxId,
        }
      }

      const element = await Model.findOne({
        include: [
          {
            model: Model.models.Activities,
            required: true,
            where: whereActivity,
          },
          {
            model: Model.models.Users,
            required: true,
          },
        ],
        where: whereHistory,
        order: [['created_at', 'desc']],
        raw: true,
      })

      if (element) {
        let contentieux = referentiel.find((r) => r.id === element['Activity.contentieux_id'])
        if (!contentieux) {
          // is child referentiel
          contentieux = referentiel.find((r) => (r.childrens || []).some((c) => c.id === element['Activity.contentieux_id'])) || {}
        }

        return {
          history: {
            id: element.id,
            updatedAt: element.updated_at,
          },
          activity: {
            id: element['Activity.id'],
            contentieuxId: element['Activity.contentieux_id'],
            periode: element['Activity.periode'],
          },
          user: {
            firstName: element['User.first_name'],
            lastName: element['User.last_name'],
          },
          contentieux: {
            id: contentieux?.id,
            label: contentieux?.label,
          },
        }
      }

      return element
    }

    let list = []
    let elementHistoryElement = null
    do {
      elementHistoryElement = await getHistory(
        list.length ? list[list.length - 1].history.id : null,
        list.length ? list[list.length - 1].activity.periode : null,
        list.length ? list[list.length - 1].activity.contentieuxId : null
      )
      if (elementHistoryElement) {
        list.push(elementHistoryElement)
      }
    } while (elementHistoryElement && list.length < 12)

    return list
  }

  return Model
}
