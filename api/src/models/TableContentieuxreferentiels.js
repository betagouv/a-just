import { groupBy } from 'lodash'
import { Op } from 'sequelize'

export default (sequelizeInstance, Model) => {
  Model.getMainTitles = async () => {
    const list = await Model.findAll({
      attributes: [['niveau_3', 'label']],
      where: {
        niveau_3: { [Op.not]: '' },
      },
      group: ['niveau_3'],
      raw: true,
    })

    return list
  }

  Model.getMainLabel = async (contentieux) => {
    const ref = await Model.findOne({
      attributes: ['niveau_1', 'niveau_3'],
      where: {
        niveau_4: contentieux,
      },
      raw: true,
    })

    if (ref) {
      return {
        mainTitle: ref.niveau_1,
        title: ref.niveau_3,
      }
    }

    return null
  }

  Model.getReferentiels = async () => {
    const list = await Model.findAll({
      attributes: [
        'niveau_1',
        'niveau_2',
        'niveau_3',
        'niveau_4',
        'average_processing_time',
      ],
      group: ['niveau_4', 'id'],
      raw: true,
    })

    const formatToGraph = (precision = 1, listToFilter = list) => {
      const listOfLevel = groupBy(listToFilter, function (n) {
        return n['niveau_' + precision]
      })

      const keys = Object.keys(listOfLevel)
      if (keys && keys.length && keys[0] === 'undefined') {
        return []
      }

      const formatedList = []
      Object.entries(listOfLevel).map(([key, value]) => {
        if (key && key !== 'null') {
          const filterIsLast = listToFilter.find(
            (l) =>
              l['niveau_' + precision] === key &&
              !l['niveau_' + (precision + 1)]
          )

          formatedList.push({
            label: key,
            childrens: formatToGraph(precision + 1, value),
            averageTreatment:
              filterIsLast && filterIsLast.average_processing_time
                ? filterIsLast.average_processing_time
                : null,
          })
        }
      })

      return formatedList
    }

    return formatToGraph()
  }

  Model.importList = async (list) => {
    // The service work by label name and not by id. Find "niveau_3" or "niveau_4" and not "id"
    await Model.destroy({
      where: {},
      force: true,
    })

    for (let i = 0; i < list.length; i++) {
      const ref = list[i]
      const findInDb = await Model.findOne({
        where: {
          niveau_1: ref.niveau_1,
          niveau_2: ref.niveau_2,
          niveau_3: ref.niveau_3,
          niveau_4: ref.niveau_4,
        },
      })
      if (!findInDb) {
        await Model.create({
          niveau_1: ref.niveau_1,
          niveau_2: ref.niveau_2,
          niveau_3: ref.niveau_3,
          niveau_4: ref.niveau_4,
        })
      }
    }
  }

  Model.getContentieuxId = async (label) => {
    const listCont = await Model.models.ContentieuxReferentiels.findAll({
      attributes: ['id', 'niveau_3', 'niveau_4'],
      where: {
        niveau_3: label,
      },
      order: ['niveau_3', 'niveau_4'],
      raw: true,
    })

    return listCont.length ? listCont[0].id : null
  }

  return Model
}
