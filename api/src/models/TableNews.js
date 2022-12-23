export default (sequelizeInstance, Model) => {
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

  return Model
}
