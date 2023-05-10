import { groupBy, sumBy } from 'lodash'
import { preformatHumanResources } from '../utils/ventilator'

export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    const list = await Model.findAll({
      attributes: ['id', ['i_elst', 'iElst'], 'label', 'latitude', 'longitude', 'population', 'enabled'],
      where: {
        parent_id: null,
      },
      order: [['label', 'asc']],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i].users = await Model.models.UserVentilations.getUserVentilations(list[i].label)
      const getBackupId = await Model.models.HRBackups.findByLabel(list[i].label)
      const agents = getBackupId ? preformatHumanResources(await Model.models.HumanResources.getCache(getBackupId), new Date()) : []
      const group = groupBy(
        agents.filter((a) => a.category),
        'category.label'
      )
      list[i].categoriesAgents = []
      for (const [key, value] of Object.entries(group)) {
        list[i].categoriesAgents.push({ label: key, nbAgents: value.length })
      }
      list[i].nbAgents = sumBy(list[i].categoriesAgents, 'nbAgents')
    }

    return list
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
