import { LOG_EVENT_ON_CLOSE } from '../constants/log-events'

/**
 * Historisation de qui à fermé une notification
 */

export default (sequelizeInstance, Model) => {
  /**
   * Save on close notification
   * @returns
   */
  Model.userCloseEvent = async (userId, newsId) => {
    const find = await Model.findOne({
      where: {
        user_id: userId,
        news_id: newsId,
        event_type: LOG_EVENT_ON_CLOSE,
      },
    })

    if (!find) {
      await Model.create({
        user_id: userId,
        news_id: newsId,
        event_type: LOG_EVENT_ON_CLOSE,
      })
    }
  }

  return Model
}
