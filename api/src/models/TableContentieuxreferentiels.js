import { orderBy } from 'lodash'
import { Op } from 'sequelize'
import { referentielMappingIndex } from '../constants/referentiel'
import { extractCodeFromLabelImported } from '../utils/referentiel'
import { camel_to_snake } from '../utils/utils'

/**
 * Scripts intermediaires des contentieux
 */

export default (sequelizeInstance, Model) => {
  /**
   * Cache du référentiel
   */
  Model.cacheReferentielMap = null

  /**
   * Retourne la liste du référentiel et prend en cache si besoin
   * @param {*} isJirs
   * @param {*} force
   * @returns
   */
  Model.getReferentiels = async (isJirs = false, force = false) => {
    const formatToGraph = async (parentId = null, index = 0) => {
      let list = await Model.findAll({
        attributes: [
          'id',
          'label',
          'code_import',
          'rank',
          ['value_quality_in', 'valueQualityIn'],
          ['value_quality_out', 'valueQualityOut'],
          ['value_quality_stock', 'valueQualityStock'],
          ['help_url', 'helpUrl'],
          'compter',
        ],
        where: {
          parent_id: parentId,
        },
        order: [['rank', 'asc']],
        raw: true,
      })

      if (list && list.length && index < 3) {
        for (let i = 0; i < list.length; i++) {
          list[i].childrens = await formatToGraph(list[i].id, index + 1)
        }
      }

      return list
    }

    if ((force === true || !Model.cacheReferentielMap) && Model) {
      const mainList = await formatToGraph()
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
          r.rank = referentielMappingIndex(r.label, r.rank)
          return r
        }),
        ['rank']
      )

      if (!isJirs) {
        list.map((elem) => {
          elem.childrens.map((child) => {
            switch (child.label) {
            case 'Collégiales hors JIRS':
              child.label = 'Collégiales'
              break
            case "Cour d'assises hors JIRS":
              child.label = "Cour d'assises"
              break
            case "Cour d'assises JIRS":
              elem.childrens = elem.childrens.filter((elem) => elem.label !== "Cour d'assises JIRS")
              break
            case 'Collégiales JIRS crim-org':
              elem.childrens = elem.childrens.filter((elem) => elem.label !== 'Collégiales JIRS crim-org')
              break
            case 'Collégiales JIRS eco-fi':
              child.label = 'Collégiales eco-fi'
              break
            case 'Eco-fi hors JIRS':
              child.label = 'Eco-fi'
              break
            case 'JIRS éco-fi':
              elem.childrens = elem.childrens.filter((elem) => elem.label !== 'JIRS éco-fi')
              break
            case 'JIRS crim-org':
              elem.childrens = elem.childrens.filter((elem) => elem.label !== 'JIRS crim-org')
              break
            case 'JIRS':
              elem.childrens = elem.childrens.filter((elem) => elem.label !== 'JIRS')
              break
            }
          })
        })
      }
      Model.cacheReferentielMap = list
    }
    return Model.cacheReferentielMap
  }

  /**
   * Importe une nouvelle liste de réfentiel et modifie, supprime et crée en fonction du code d'import.
   * @param {*} list
   * @returns
   */
  Model.importList = async (list) => {
    // The service work by label name and not by id. Find "niveau_3" or "niveau_4" and not "id"
    const listCodeUpdated = []
    const deltaToUpdate = []

    const minLevel = 3
    const nbLevel = 4

    for (let i = 0; i < list.length; i++) {
      const ref = list[i]
      let parentId = null
      for (let i = minLevel - 1; i <= nbLevel; i++) {
        if (i === minLevel - 1) {
          // get main group
          const findInDb = await Model.findOne({
            where: {
              label: ref['niveau_' + i],
            },
            logging: false,
          })
          if (findInDb) {
            parentId = findInDb.dataValues.id
          }
        }

        if (ref['niveau_' + i]) {
          const extract = extractCodeFromLabelImported(ref['niveau_' + i])
          if (extract && extract.code) {
            if (listCodeUpdated.indexOf(extract.code) === -1) {
              listCodeUpdated.push(extract.code)
            }

            const findInDb = await Model.findOne({
              where: {
                code_import: extract.code,
              },
              logging: false,
            })
            if (!findInDb) {
              const newToDb = await Model.create(
                {
                  label: extract.label,
                  code_import: extract.code,
                  parent_id: parentId,
                },
                {
                  logging: false,
                }
              )

              parentId = newToDb.dataValues.id
              deltaToUpdate.push({
                type: 'CREATE',
                id: newToDb.dataValues.id,
                label: extract.label,
              })
            } else {
              if (extract.label !== findInDb.dataValues.label) {
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
    for (let i = 0; i < listToRemove.length; i++) {
      const l = listToRemove[i]
      await Model.destroyById(l.id)
      deltaToUpdate.push({
        type: 'DELETE',
        label: l.label,
        id: l.id,
      })
    }

    const humanList = []
    const idNacFinded = deltaToUpdate.map((d) => d.id)
    const humanFromDB = await Model.models.HumanResources.findAll({
      raw: true,
    })
    for (let i = 0; i < humanFromDB.length; i++) {
      const situations = await Model.models.HRSituations.getListByHumanId(humanFromDB[i].id)
      const activities = situations.reduce((acc, cur) => {
        const filterActivities = (cur.activities || []).filter((c) => idNacFinded.indexOf(c.contentieux.id) !== -1)
        return acc.concat(filterActivities)
      }, [])

      if (activities.length) {
        const contentieuxIds = activities.map((a) => a.contentieux.id)
        humanList.push({
          person: humanFromDB[i],
          situations,
          activitiesImpacted: activities,
          impact: deltaToUpdate.filter((d) => contentieuxIds.indexOf(d.id) !== -1),
        })
      }
    }

    // order contentieux
    await Model.setRankToContentieux(list)

    // force to reload referentiel to cache
    await Model.getReferentiels(true)

    return {
      persons: humanList,
      referentiel: deltaToUpdate,
    }
  }

  /**
   * Retourne le contentieux id en fonction de son nom
   * @param {*} label
   * @returns
   */
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

  /**
   * Update contentieux rank
   * @param {*} list
   */
  Model.setRankToContentieux = async (list, nodeLevel = 1) => {
    const listUpdated = []
    let rank = 1

    for (let i = 0; i < list.length; i++) {
      const extract = extractCodeFromLabelImported(list[i][`niveau_${nodeLevel}`])
      if (extract) {
        let cont

        if (extract.code) {
          const code = extract.code

          if (!listUpdated.includes(code)) {
            listUpdated.push(code)

            cont = await Model.findOne({
              where: {
                code_import: code,
              },
            })
          }
        } else {
          const label = extract.label

          if (!listUpdated.includes(label)) {
            listUpdated.push(label)

            cont = await Model.findOne({
              where: {
                label,
              },
            })
          }
        }

        if (cont) {
          rank++
          await cont.update({ rank })
        }
      }
    }

    if (nodeLevel < 4) {
      await Model.setRankToContentieux(list, nodeLevel + 1)
    }
  }

  Model.updateRef = async (id, node, value) => {
    const ref = await Model.findOne({
      where: {
        id,
      },
    })

    if (ref) {
      ref.set({ [camel_to_snake(node)]: value })
      await ref.save()
      Model.cacheReferentielMap = null
    }
  }

  Model.getOneReferentiel = async (id) => {
    const ref = await Model.findOne({
      where: {
        id,
      },
    })
    return ref ? ref : null
  }

  return Model
}
