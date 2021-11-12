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
    const formatToGraph = async (parentId = null) => {
      const list = await Model.findAll({
        attributes: [
          'id',
          'label',
          ['average_processing_time', 'averageProcessingTime'],
        ],
        where: {
          parent_id: parentId,
        },
        raw: true,
      })

      if(list && list.length) {
        for(let i = 0; i < list.length; i++) {
          list[i].childrens = await formatToGraph(list[i].id)
        }
      }
      
      return list
    }

    return await formatToGraph()
  }

  Model.importList = async (list) => {
    // The service work by label name and not by id. Find "niveau_3" or "niveau_4" and not "id"
    await Model.destroy({
      where: {},
      force: true,
    })
    const nbLevel = 6

    for (let i = 0; i < list.length; i++) {
      const ref = list[i]
      let parentId = null
      for(let i = 1; i <= nbLevel; i++) {
        if(ref['niveau_' + i]) {
          const findInDb = await Model.findOne({
            where: {
              label: ref['niveau_' + i],
            },
          })
          if(!findInDb) {
            const newToDb = await Model.create({
              label: ref['niveau_' + i],
              parent_id: parentId,
            })
            parentId = newToDb.dataValues.id
          } else {
            parentId = findInDb.dataValues.id
          }
        }
      }
    }
  }

  Model.getContentieuxId = async (label) => {
    const listCont = await Model.models.ContentieuxReferentiels.findAll({
      attributes: ['id', 'niveau_3', 'niveau_4'],
      where: {
        [Op.or]: [
          {
            niveau_3: label,
          },
          {
            niveau_4: label,
          },
        ],
      },
      order: ['niveau_3', 'niveau_4'],
      raw: true,
    })

    console.log(listCont)

    return listCont.length ? listCont[0].id : null
  }

  return Model
}
