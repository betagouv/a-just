export default (sequelizeInstance, Model) => {
  Model.cacheReferentielMap = null

  Model.getMainTitles = async () => {
    const ref = await Model.getReferentiels()
    let list = []
    ref.map((main) => {
      if (main.childrens) {
        main.childrens.map((subMain) => {
          if (subMain.childrens) {
            list = list.concat(subMain.childrens)
          }
        })
      }
    })

    return list
  }

  Model.getMainLabel = async (contentieux) => {
    const ref = await Model.findOne({
      attributes: ['id'],
      where: {
        label: contentieux,
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
    const formatToGraph = async (parentId = null, index = 0) => {
      const list = await Model.findAll({
        attributes: [
          'id',
          'label',
        ],
        where: {
          parent_id: parentId,
        },
        raw: true,
      })

      if(list && list.length && index < 3) {
        for(let i = 0; i < list.length; i++) {
          list[i].childrens = await formatToGraph(list[i].id, index + 1)
        }
      }
      
      return list
    }

    if(!Model.cacheReferentielMap) {
      Model.cacheReferentielMap = await formatToGraph()
    }

    return Model.cacheReferentielMap
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
    const listCont = await Model.findOne({
      attributes: ['id'],
      where: {
        label,
      },
      raw: true,
    })

    return listCont ? listCont.id : null
  }

  return Model
}
