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

  Model.getReferentiels = async (force = false) => {
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

    if(force === true || !Model.cacheReferentielMap) {
      Model.cacheReferentielMap = await formatToGraph()
    }

    return Model.cacheReferentielMap
  }

  Model.importList = async (list) => {
    //list = list.slice(95, 102)
    // The service work by label name and not by id. Find "niveau_3" or "niveau_4" and not "id"
    await Model.destroy({
      where: {},
      force: true,
    })
    const nbLevel = 4

    for (let i = 0; i < list.length; i++) {
      const ref = list[i]
      //console.log(ref)
      let parentId = null
      for(let i = 1; i <= nbLevel; i++) {
        if(ref['niveau_' + i]) {
          const findInDb = await Model.findOne({
            where: {
              label: ref['niveau_' + i],
            },
            logging: false,
          })
          if(!findInDb) {
            const newToDb = await Model.create({
              label: ref['niveau_' + i],
              parent_id: parentId,
            }, {
              logging: false,
            })
            console.log('ADD ', ref['niveau_' + i], newToDb.dataValues.id, parentId)
            parentId = newToDb.dataValues.id
          } else {
            parentId = findInDb.dataValues.id
          }
        }
      }
    }

    // force to reload referentiel to cache
    await Model.getReferentiels(true)
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
