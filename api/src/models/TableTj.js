export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    return await Model.findAll({
      attributes: ['id', ['i_elst', 'iElst'], 'label', 'latitude', 'longitude', 'population', 'enabled'],
      order: [['label', 'asc']],
    })
  }

  Model.getAllVisibles = async () => {
    return await Model.findAll({
      attributes: ['id', ['i_elst', 'iElst'], 'label', 'latitude', 'longitude', 'population', 'enabled'],
      where: {
        enabled: true,
      },
      order: [['label', 'asc']],
    })
  }

  /**
   * Retourne les juridictions qui peuvent s'afficher si seulement elles sont bloqués via ce tableau
   * @param {*} juridictionLabel
   * @returns
   */
  Model.isVisible = async (juridictionLabel) => {
    const TJFinded = await Model.findOne({
      where: {
        label: juridictionLabel,
      },
      raw: true,
    })

    if (!TJFinded || (TJFinded && TJFinded.enabled)) {
      return true
    }

    return false
  }

  return Model
}
