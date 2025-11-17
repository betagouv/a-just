import { Op } from 'sequelize'
import { month } from '../utils/date'

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
    const listFiltered = []
    // retourne tous ceux dont la dernière valeure est null
    for (let i = 0; i < listId.length; i++) {
      const getLastValue = await Model.findAll({
        attributes: ['activity_id', 'value'],
        where: {
          activity_id: listId[i],
        },
        order: [['updated_at', 'desc']],
        limit: 1,
        raw: true,
      })

      if (getLastValue.length && getLastValue[0].value) {
        listFiltered.push(listId[i])
      }
    }

    const listUpdated = await Model.findAll({
      attributes: ['user_id', 'updated_at'],
      where: {
        activity_id: listFiltered,
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
  Model.getLasHumanActivites = async (HRBackupId, userId) => {
    const referentiel = (await Model.models.ContentieuxReferentiels.getReferentiels(HRBackupId, false, null, false, false, userId)) || []

    const getHistory = async (historyId = null, activityId = null, contentieuxId = null, activityDate = null) => {
      const whereActivity = {
        hr_backup_id: HRBackupId,
      }
      const whereHistory = {}

      if (historyId) {
        whereHistory.id = {
          [Op.lt]: historyId,
        }
      }

      if (activityId) {
        whereHistory.activity_id = {
          [Op.ne]: activityId,
        }
      }

      /*if (contentieuxId) {
        whereActivity.contentieux_id = {
          [Op.ne]: contentieuxId,
        }
      }*/

      const element = await Model.findOne({
        include: [
          {
            attributes: ['contentieux_id', 'periode'],
            model: Model.models.Activities,
            required: true,
            where: whereActivity,
          },
          {
            attributes: ['first_name', 'last_name'],
            model: Model.models.Users,
            required: true,
          },
        ],
        where: whereHistory,
        order: [['created_at', 'desc']],
        raw: true,
      })

      if (element && !element.value) {
        return await getHistory(element.id, element['Activity.id'], element['Activity.contentieux_id'], element['Activity.periode'])
      } else if (
        element &&
        element['Activity.contentieux_id'] === contentieuxId &&
        month(element['Activity.periode']).getTime() === month(activityDate).getTime()
      ) {
        return await getHistory(element.id, element['Activity.id'], contentieuxId, activityDate)
      } else if (element) {
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
          db: element,
        }
      }

      return element
    }

    let list = []
    let elementHistoryElement = null
    do {
      elementHistoryElement = await getHistory(
        list.length ? list[list.length - 1].history.id : null,
        list.length ? list[list.length - 1].activity.id : null,
        list.length ? list[list.length - 1].activity.contentieuxId : null,
        list.length ? list[list.length - 1].activity.periode : null,
      )
      if (elementHistoryElement) {
        list.push(elementHistoryElement)
      }
    } while (elementHistoryElement && list.length < 12)

    return list.filter((item) => item.contentieux.id)
  }

  return Model
}
