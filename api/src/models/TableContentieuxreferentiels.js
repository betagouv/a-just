import { orderBy } from 'lodash'
import { Op } from 'sequelize'
import { extractCodeFromLabelImported, referentielMappingIndex } from '../utils/referentiel'

export default (sequelizeInstance, Model) => {
  Model.cacheReferentielMap = null

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
      const mainList = await await formatToGraph()
      let list = []
      mainList.map((main) => {
        if (main.childrens) {
          main.childrens.map((subMain) => {
            if (subMain.childrens) {
              list = list.concat(subMain.childrens)
            }
          })
        }
      })

      // force to order list
      list = orderBy(
        list.map((r) => {
          r.rank = referentielMappingIndex(r.label)
          return r
        }),
        ['rank']
      )
    
      Model.cacheReferentielMap = list 
    }

    return Model.cacheReferentielMap
  }

  Model.formatReferentielWithCode = async (list) => {
    for (let i = 0; i < list.length; i++) {
      const ref = list[i]

      for (let i = 3; i <= 4; i++) {
        if(ref['niveau_' + i]) {
          const extract = extractCodeFromLabelImported(ref['niveau_' + i])
          if(extract && extract.code) {
            const findToDB = await Model.findOne({
              where: {
                label: extract.label,
                code_import: null,
              },
            })
            if(findToDB) {
              console.log(extract)
              await findToDB.update({
                code_import: extract.code,
              })
            }
          }
        }
      }
    }
  }

  Model.importList = async (list) => {
    // The service work by label name and not by id. Find "niveau_3" or "niveau_4" and not "id"
    const listCodeUpdated = []
    const deltaToUpdate = []

    const minLevel = 3
    const nbLevel = 4

    for (let i = 0; i < list.length; i++) {
      const ref = list[i]
      //console.log(ref)
      let parentId = null
      for(let i = minLevel - 1; i <= nbLevel; i++) {
        if(i === minLevel - 1) {
          // get main group
          const findInDb = await Model.findOne({
            where: {
              label: ref['niveau_' + i],
            },
            logging: false,
          })
          if(findInDb) {
            parentId = findInDb.dataValues.id
          }
        }

        if(ref['niveau_' + i]) {
          const extract = extractCodeFromLabelImported(ref['niveau_' + i])
          if(extract && extract.code) {
            if(listCodeUpdated.indexOf(extract.code) === -1) {
              listCodeUpdated.push(extract.code) 
            }

            const findInDb = await Model.findOne({
              where: {
                code_import: extract.code,
              },
              logging: false,
            })
            if(!findInDb) {
              const newToDb = await Model.create({
                label: extract.label,
                code_import: extract.code,
                parent_id: parentId,
              }, {
                logging: false,
              })
              
              parentId = newToDb.dataValues.id
              deltaToUpdate.push({
                type: 'CREATE',
                id: newToDb.dataValues.id,
                label: extract.label,
              })
            } else {
              if(extract.label !== findInDb.dataValues.label) {
                deltaToUpdate.push({
                  type: 'UPDATE',
                  oldLabel: findInDb.dataValues.label,
                  id: findInDb.dataValues.id,
                  label: extract.label,
                }) 

                // update only one time         
                await findInDb.update({ label: extract.label })
              }
              parentId = findInDb.dataValues.id
            }
          }
        }
      }
    }

    // REMOVE OLD REFERENTIELS
    const listToRemove = await Model.findAll({
      attributes: ['id', 'label', 'code_import', 'parent_id'],
      where: {
        code_import: {
          [Op.notIn]: listCodeUpdated,
        },
      },
      raw: true,
    })
    for(let i = 0; i < listToRemove.length; i++) {
      const l = listToRemove[i]
      await Model.destroyById(l.id)
      deltaToUpdate.push({
        type: 'DELETE',
        label: l.label,
        id: l.id,
      })
    }

    const humanList = []
    const idNacFinded = deltaToUpdate.map(d => (d.id))
    const humanFromDB = await Model.models.HumanResources.findAll({
      raw: true,
    })
    for(let i = 0; i < humanFromDB.length; i++) {
      const situations = await Model.models.HRSituations.getListByHumanId(humanFromDB[i].id)
      const activities = situations.reduce((acc, cur) => {
        const filterActivities = (cur.activities || []).filter(c => idNacFinded.indexOf(c.contentieux.id) !== -1)
        return acc.concat(filterActivities)
      }, [])

      if(activities.length) {
        const contentieuxIds = activities.map(a => (a.contentieux.id))
        humanList.push({
          person: humanFromDB[i],
          situations,
          activitiesImpacted: activities,
          impact: deltaToUpdate.filter(d => contentieuxIds.indexOf(d.id) !== -1),
        })
      }
    }

    // force to reload referentiel to cache
    await Model.getReferentiels(true)

    return { 
      persons: humanList,
      referentiel: deltaToUpdate,
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

  Model.getReferentiels(true) // force to init
  return Model
}
