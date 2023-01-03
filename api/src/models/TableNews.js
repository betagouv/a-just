import { camel_to_snake_object } from '../utils/utils'

export default (sequelizeInstance, Model) => {
  /**
   * Retourne la totalité des news reformatés en camel case
   * @returns
   */
  Model.getAll = async () => {
    const list = await Model.findAll({
      attributes: [
        'id',
        'html',
        'icon',
        ['background_color', 'backgroundColor'],
        ['text_color', 'textColor'],
        ['delay_before_auto_closing', 'delayBeforeAutoClosing'],
        ['action_button_text', 'actionButtonText'],
        ['action_button_url', 'actionButtonUrl'],
        ['action_button_color', 'actionButtonColor'],
        ['date_start', 'dateStart'],
        ['date_stop', 'dateStop'],
        'enabled',
      ],
    })

    return list
  }

  /**
   * Modifie ou créée une news existante
   * @param {*} param0
   */
  Model.updateCreate = async ({
    id,
    html,
    icon,
    backgroundColor,
    textColor,
    delayBeforeAutoClosing,
    actionButtonText,
    actionButtonUrl,
    actionButtonColor,
    dateStart,
    dateStop,
    enabled,
  }) => {
    const findExistingNews = await Model.findOne({
      where: {
        id,
      },
    })

    const options = camel_to_snake_object({
      html,
      icon,
      backgroundColor,
      textColor,
      delayBeforeAutoClosing,
      actionButtonText,
      actionButtonUrl,
      actionButtonColor,
      dateStart,
      dateStop,
      enabled,
    })

    if (findExistingNews) {
      await findExistingNews.update(options)
    } else {
      await Model.create(options)
    }

    return true
  }

  return Model
}
