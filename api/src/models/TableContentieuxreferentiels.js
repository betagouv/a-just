import { difference, orderBy } from 'lodash'
import { Op } from 'sequelize'
import { referentielCAMappingIndex, referentielMappingIndex } from '../constants/referentiel'
import { extractCodeFromLabelImported, jirsRules } from '../utils/referentiel'
import { camel_to_snake } from '../utils/utils'
import config from 'config'
import { isTj } from '../utils/ca'

/**
 * Scripts intermediaires des contentieux
 */

export default (sequelizeInstance, Model) => {
  /**
   * Retourne la liste du référentiel
   * @param {*} isJirs
   * @returns
   */
  Model.getReferentiels = async (backupId = null, isJirs = false, filterReferentielsId = null, displayAll = false) => {
    if (backupId) {
      const juridiction = await Model.models.HRBackups.findById(backupId)
      if (juridiction && !displayAll) {
        isJirs = juridiction.jirs
      }
    }
    if (displayAll === true) {
      isJirs = true
    }

    const formatToGraph = async (parentId = null, index = 0) => {
      const where = {}
      if (backupId) {
        where[Op.or] = [
          {
            only_to_hr_backup: null,
          },
          {
            only_to_hr_backup: { [Op.contains]: [backupId] },
          },
        ]
      }
      // filter by referentiel only for level 3
      if (filterReferentielsId && index === 2) {
        where.id = filterReferentielsId
      }

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
          'category',
          ['only_to_hr_backup', 'onlyToHrBackup'],
          ['check_ventilation', 'checkVentilation'],
        ],
        where: {
          parent_id: parentId,
          ...where,
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

    const mainList = await formatToGraph()
    let list = []
    mainList.map((main) => {
      if (main.code_import) {
        main.childrens = (main.childrens || []).map((m) => {
          delete m.childrens
          return m
        })
        list = list.concat(main)
      } else {
        if (main.childrens) {
          main.childrens.map((subMain) => {
            if (subMain.childrens) {
              list = list.concat(subMain.childrens)
            }
          })
        }
      }
    })

    // force to order list
    list = orderBy(
      list.map((r) => {
        // si A-JUST CA
        if (Number(config.juridictionType) === 1) r.rank = referentielCAMappingIndex(r.label, r.rank)
        else r.rank = referentielMappingIndex(r.label, r.rank)

        return r
      }),
      ['rank'],
    )

    list = jirsRules(list, isJirs)

    return list
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
                  category: extract.code.startsWith(isTj() ? '12.' : '14.') && extract.code.length > 3 ? ref['niveau_' + (i + 1)] : null,
                },
                {
                  logging: false,
                },
              )

              parentId = newToDb.dataValues.id
              deltaToUpdate.push({
                type: 'CREATE',
                id: newToDb.dataValues.id,
                label: extract.label,
              })
            } else {
              if (extract.code.startsWith(isTj() ? '12.' : '14.') && extract.code.length > 3 && findInDb.dataValues.category !== ref['niveau_' + (i + 1)]) {
                deltaToUpdate.push({
                  type: 'UPDATE',
                  oldCategory: findInDb.dataValues.category,
                  id: findInDb.dataValues.id,
                  category: ref['niveau_' + (i + 1)] || null,
                })

                await findInDb.update({ category: ref['niveau_' + (i + 1)] })
              }

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
      const oldValue = ref[camel_to_snake(node)]
      ref.set({ [camel_to_snake(node)]: value })
      await ref.save()

      if (node === 'onlyToHrBackup') {
        const hasChild = await Model.findOne({
          where: {
            parent_id: ref.dataValues.id,
          },
          raw: true,
        })
        if (!hasChild) {
          let hrBackupUpdated = []
          let allJuridictions = (await Model.models.HRBackups.getAll()).map((h) => h.id)
          if (Array.isArray(oldValue) && Array.isArray(value)) {
            hrBackupUpdated = [...oldValue.filter((e) => !value.includes(e)), ...value.filter((e) => !oldValue.includes(e))]
          } else if (oldValue === null && Array.isArray(value)) {
            hrBackupUpdated = allJuridictions.filter((e) => !value.includes(e))
          } else if (Array.isArray(oldValue) && value === null) {
            hrBackupUpdated = allJuridictions.filter((e) => !oldValue.includes(e))
          }
          //console.log('old value', oldValue)
          //console.log('new value', value)
          //console.log('delta juridictions', hrBackupUpdated)
          // synchronise by main contentieux

          // test 16s pour les ventilations
          await Model.models.HRActivities.syncAllVentilationByContentieux(ref.dataValues.parent_id)
          // test toutes les juridictions à 1,8min
          await Model.models.Activities.syncAllActivitiesByContentieux(ref.dataValues.parent_id, hrBackupUpdated)
          // reload all agents environ 40s / juridictions (180 environ)
          await Model.models.HumanResources.forceRecalculateAllHrCache()
        }
      }
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

  /**
   * Indique si une juridiction est JIRS ou NON JIRS
   * @param {*} backupId
   * @returns
   */
  Model.isJirs = async (backupId) => {
    let isJirs = false
    const juridiction = await Model.models.HRBackups.findById(backupId)
    if (juridiction) isJirs = juridiction.jirs
    return isJirs
  }

  return Model
}
