import { groupBy, sumBy } from 'lodash'
import { listCategories } from '../utils/ventilator'
import { loadOrWarmHR } from '../utils/redis'

export default (sequelizeInstance, Model) => {
  Model.getAll = async () => {
    const list = await Model.findAll({
      attributes: ['id', ['i_elst', 'iElst'], 'label', 'latitude', 'longitude', 'population', 'enabled', 'backup_id'],
      where: {
        parent_id: null,
      },
      order: [['label', 'asc']],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i].users = await Model.models.UserVentilations.getUserVentilationsWithLabel(list[i].label)
      const getBackupId = await Model.models.HRBackups.findByLabel(list[i].label)
      const agents = getBackupId ? listCategories(await loadOrWarmHR(getBackupId, Model.models)) : []
      const group = groupBy(
        agents.filter((a) => a.category),
        'category.label',
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
   * Retourne toutes les juridictions qui ont au moins un agent ventilé
   * @returns
   */
  Model.getAllWithUser = async () => {
    const jurisdictions = await Model.findAll({
      attributes: ['id', ['i_elst', 'iElst'], 'label', 'latitude', 'longitude', 'population', 'enabled'],
      where: {
        parent_id: null,
      },
      order: [['label', 'asc']],
      raw: true,
    })

    const filtered = []

    for (const jurisdiction of jurisdictions) {
      const users = await Model.models.UserVentilations.getUserVentilationsWithLabel(jurisdiction.label)

      if (users && users.length > 0) {
        filtered.push(jurisdiction)
      }
    }

    return filtered
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
  Model.updateJuridiction = async (juridictionId, node, values) => {
    let element = await Model.findOne({
      where: {
        id: juridictionId,
      },
    })

    if (element) {
      if (node === 'enabled') {
        element = await element.update({
          enabled: values === 'oui' ? true : false,
        })
      } else {
        element = await element.update({
          [node]: values,
        })
      }

      if (node === 'label' || !element.dataValues.backup_id) {
        const juridicitionId = await Model.models.HRBackups.findOrCreateLabel(
          element.dataValues.label,
          element.dataValues.backup_id,
          node === 'label' ? values : null,
          false,
        )

        if (!element.dataValues.backup_id) {
          await element.update({
            backup_id: juridicitionId,
          })
          await Model.models.HRBackups.addUserAccessToTeam(juridicitionId)
        }
      }
    }
  }

  /**
   * Obtenir la liste de tout les TGI et TPRX avec leurs IELST
   */
  Model.getAllIelst = async () => {
    let res = {}

    const getList = async (parentId) => {
      const list = await Model.findAll({
        attributes: ['id', ['i_elst', 'iElst'], 'label', 'type', 'parent_id'],
        where: {
          parent_id: parentId,
          type: ['TGI', 'TPRX', 'CPH'],
        },
        raw: true,
      })
      return list
    }

    const list = await getList(null)

    for (let i = 0; i < list.length; i++) {
      res['00' + list[i].iElst] = list[i].label.split(' ').join('_')
      const children = await getList(list[i].id)
      for (let j = 0; j < children.length; j++) {
        res['00' + children[j].iElst] = list[i].label.split(' ').join('_')
      }
    }
    return res
  }

  /**
   * Ajout d'une ligne un events
   * @param {*} codeId
   * @param {*} userId
   * @param {*} datas
   */
  Model.addIELST = async (i_elst, label, latitude, longitude, population, backup_id = null, enabled = false) => {
    await Model.create({
      i_elst: Number(i_elst),
      label: label,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      population: Number(population),
      type: 'TGI',
    })
  }
  return Model
}
