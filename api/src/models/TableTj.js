export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    return await Model.findAll({
      attributes: ['id', ['i_elst', 'iElst'], 'label', 'latitude', 'longitude', 'population', 'enabled'],
      where: {
        parent_id: null,
      },
      order: [['label', 'asc']],
    })
  }

  Model.getAllVisibles = async () => {
    return await Model.findAll({
      attributes: ['id', ['i_elst', 'iElst'], 'label', 'latitude', 'longitude', 'population', 'enabled'],
      where: {
        enabled: true,
        parent_id: null,
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

  /**
   * GET TJ and T PROX by juridiction label
   */
  Model.getByTj = async (juridictionLabel, optionsTJ = {}, optionsSubJuridiction = {}) => {
    const attributes = ['id', 'i_elst', 'label', 'type', 'parent_id']
    let list = []

    const findTJ = await Model.findOne({
      attributes,
      where: {
        label: juridictionLabel,
        ...optionsTJ,
      },
      raw: true,
    })

    if (findTJ) {
      list.push({ ...findTJ, tj: findTJ.label, tprox: findTJ.label })

      const subJuridictions = await Model.findAll({
        attributes,
        where: {
          parent_id: findTJ.id,
          ...optionsSubJuridiction,
        },
        raw: true,
      })

      list = [...list, ...subJuridictions.map((s) => ({ ...s, tj: findTJ.label, tprox: s.label }))]
    }

    return list
  }

  /**
   * Update juridiction value
   */
  Model.updateJuridiction = async (juridictionId, values) => {
    const element = await Model.findOne({
      where: {
        id: juridictionId,
      },
    })

    if (element) {
      await element.update(values)

      if (values.enabled) {
        // check and create juridiction
        await Model.models.HRBackups.findOrCreateLabel(element.dataValues.label)
      }
    }
  }

  return Model
}
