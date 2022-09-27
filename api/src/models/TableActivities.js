import { endOfMonth, startOfMonth } from 'date-fns'
import { Op } from 'sequelize'
import {
  calculMainValuesFromChilds,
  preformatActivitiesArray,
} from '../utils/activities'

export default (sequelizeInstance, Model) => {
  Model.getLastMonth = async (HRBackupId) => {
    const theLast = await Model.findOne({
      attributes: ['periode'],
      where: {
        hr_backup_id: HRBackupId,
      },
      order: [['periode', 'desc']],
      raw: true,
    })

    if (theLast) {
      return theLast.periode
    }

    return null
  }

  Model.getAll = async (HRBackupId) => {
    const list = await Model.findAll({
      attributes: [
        'periode',
        'entrees',
        'sorties',
        'stock',
        'original_entrees',
        'original_sorties',
        'original_stock',
      ],
      where: {
        hr_backup_id: HRBackupId,
      },
      include: [
        {
          model: Model.models.ContentieuxReferentiels,
        },
      ],
      order: [['periode', 'asc']],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        periode: list[i].periode,
        entrees:
          list[i].entrees !== null ? list[i].entrees : list[i].original_entrees,
        sorties:
          list[i].sorties !== null ? list[i].sorties : list[i].original_sorties,
        stock: list[i].stock !== null ? list[i].stock : list[i].original_stock,
        contentieux: {
          id: list[i]['ContentieuxReferentiel.id'],
          label: list[i]['ContentieuxReferentiel.label'],
        },
      }
    }

    return list
  }

  Model.importList = async (csv, HRBackupId) => {
    const contentieuxIds = {}
    let minDate = null

    for (let i = 0; i < csv.length; i++) {
      const code = csv[i].code_import

      if (!contentieuxIds[code]) {
        const contentieux = await Model.models.ContentieuxReferentiels.findOne({
          attributes: ['id'],
          where: {
            code_import: code,
          },
          raw: true,
        })

        if (contentieux) {
          contentieuxIds[code] = contentieux.id
        }
      }

      if (contentieuxIds[code]) {
        const year = csv[i].periode.slice(0, 4)
        const month = +csv[i].periode.slice(-2) - 1
        const periode = new Date(year, month)

        if (minDate === null || periode.getTime() < minDate.getTime()) {
          minDate = new Date(periode)
        }

        const findExist = await Model.findOne({
          where: {
            hr_backup_id: HRBackupId,
            contentieux_id: contentieuxIds[code],
            periode: {
              [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
            },
          },
        })

        // clean null values
        csv[i].entrees = csv[i].entrees === 'null' ? null : csv[i].entrees
        csv[i].sorties = csv[i].sorties === 'null' ? null : csv[i].sorties
        csv[i].stock = csv[i].stock === 'null' ? null : csv[i].stock

        // if existe update content
        if (
          findExist &&
          (csv[i].entrees !== findExist.dataValues.original_entrees ||
            csv[i].sorties !==
              findExist.dataValues.original_sorties ||
            csv[i].stock !== findExist.dataValues.original_stock)
        ) {
          await findExist.update({
            original_entrees: csv[i].entrees,
            original_sorties: csv[i].sorties,
            original_stock: csv[i].stock,
          })
        } else if (!findExist) {
          // else create
          await Model.create({
            hr_backup_id: HRBackupId,
            periode,
            contentieux_id: contentieuxIds[code],
            original_entrees: csv[i].entrees,
            original_sorties: csv[i].sorties,
            original_stock: csv[i].stock,
          })
        }
      }
    }

    await Model.cleanActivities(HRBackupId, minDate)
  }

  Model.removeDuplicateDatas = async (HRBackupId) => {
    const activities = await Model.findAll({
      attributes: ['periode', 'contentieux_id', 'hr_backup_id'],
      where: {
        hr_backup_id: HRBackupId,
      },
      group: ['periode', 'contentieux_id', 'hr_backup_id'],
      raw: true,
    })

    for (let i = 0; i < activities.length; i++) {
      const periode = activities[i].periode

      const duplicateActivities = await Model.findAll({
        where: {
          periode: {
            [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
          },
          hr_backup_id: HRBackupId,
          contentieux_id: activities[i].contentieux_id,
        },
        order: ['updated_at', 'id'],
      })

      if (duplicateActivities.length >= 2) {
        for (let z = 1; z < duplicateActivities.length; z++) {
          await duplicateActivities[z].destroy()
        }
      }
    }
  }

  Model.cleanActivities = async (HRBackupId, minPeriode = null) => {
    const referentiels =
      await Model.models.ContentieuxReferentiels.getReferentiels()

    if (!minPeriode) {
      const minPeriodeFromDB = await Model.min('periode', {
        where: {
          hr_backup_id: HRBackupId,
        },
      })

      if (minPeriodeFromDB) {
        minPeriode = new Date(minPeriodeFromDB)
      }
    }

    console.log('minPeriode', minPeriode)
    if (!minPeriode) {
      return // stop we don't have values to analyse
    }

    for (let i = 0; i < referentiels.length; i++) {
      await Model.updateTotalAndFuturValue(
        referentiels[i].id,
        minPeriode,
        HRBackupId
      )
    }
  }

  Model.updateBy = async (
    contentieuxId,
    date,
    values,
    hrBackupId,
    userId,
    nodeUpdated
  ) => {
    console.log(
      'updateBy',
      contentieuxId,
      date,
      values,
      hrBackupId,
      userId,
      nodeUpdated
    )
    date = new Date(date)

    let findActivity = await Model.findOne({
      where: {
        periode: {
          [Op.between]: [startOfMonth(date), endOfMonth(date)],
        },
        hr_backup_id: hrBackupId,
        contentieux_id: contentieuxId,
      },
    })

    if (findActivity) {
      await findActivity.update(values)
    } else {
      findActivity = await Model.create({
        ...values,
        hr_backup_id: hrBackupId,
        contentieux_id: contentieuxId,
        periode: date,
      })
    }

    if (userId !== null) {
      await Model.models.HistoriesActivitiesUpdate.addHistory(
        userId,
        findActivity.dataValues.id,
        nodeUpdated,
        values[nodeUpdated]
      )
    }

    const referentiels =
      await Model.models.ContentieuxReferentiels.getReferentiels()
    const ref = referentiels.find((r) =>
      (r.childrens || []).find((c) => c.id === contentieuxId)
    )

    if (ref) {
      await Model.updateTotalAndFuturValue(ref.id, date, hrBackupId)
    }
  }

  Model.updateTotalAndFuturValue = async (
    mainContentieuxId,
    date,
    hrBackupId
  ) => {
    date = new Date(date) // detach date reference
    const referentiels =
      await Model.models.ContentieuxReferentiels.getReferentiels()
    const ref = referentiels.find((r) => r.id === mainContentieuxId)
    // console.log(ref)
    console.log('startOfMonth(date), endOfMonth(date)', date, startOfMonth(date), endOfMonth(date))

    if (ref) {
      let continueToDo = false
      do {
        const childrens = ref.childrens || []
        // console.log('check date', date, mainContentieuxId, hrBackupId)

        for (let cIndex = 0; cIndex < childrens.length; cIndex++) {
          // IF not exist, create it
          if (
            !(await Model.findOne({
              where: {
                periode: {
                  [Op.between]: [startOfMonth(date), endOfMonth(date)],
                },
                hr_backup_id: hrBackupId,
                contentieux_id: childrens[cIndex].id,
              },
            }))
          ) {
            await Model.create({
              periode: date,
              hr_backup_id: hrBackupId,
              contentieux_id: childrens[cIndex].id,
            })
          }
        }

        // update main activity with entrees, sorties, stock
        const findAllChild = await Model.findAll({
          where: {
            periode: {
              [Op.between]: [startOfMonth(date), endOfMonth(date)],
            },
            hr_backup_id: hrBackupId,
            contentieux_id: ref.childrens.map((r) => r.id),
          },
          raw: true,
        })

        // calcul stock of custom stock
        for (let i = 0; i < findAllChild.length; i++) {
          let currentStock = findAllChild[i].stock
          // if exist stock and is updated by user do not get previous stock
          const getUserUpdateStock =
            await Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(
              findAllChild[i].id,
              'stock'
            )

          //console.log('currentStock', currentStock, getUserUpdateStock)
          
          // do not updated if updated by user
          if (!getUserUpdateStock || getUserUpdateStock.value === null) {
            const previousStockValue = await Model.checkAndUpdatePreviousStock(
              findAllChild[i].contentieux_id,
              date,
              hrBackupId
            )

            if (previousStockValue !== null) {
              if (
                findAllChild[i].entrees !== null ||
                findAllChild[i].sorties !== null ||
                previousStockValue.type === 'calculate'
              ) {
                const entrees = preformatActivitiesArray(
                  [findAllChild[i]],
                  ['entrees', 'original_entrees']
                )
                const sorties = preformatActivitiesArray(
                  [findAllChild[i]],
                  ['sorties', 'original_sorties']
                )
                currentStock =
                  previousStockValue.stock + (entrees || 0) - (sorties || 0)
              } else {
                currentStock = findAllChild[i].original_stock
              }
            } else {
              currentStock = findAllChild[i].original_stock

              if (findAllChild[i].entrees !== null) {
                currentStock += (findAllChild[i].entrees || 0)
              } else if (findAllChild[i].original_entrees !== null && findAllChild[i].sorties !== null) {
                currentStock += (findAllChild[i].original_entrees || 0)
              }

              if (findAllChild[i].sorties !== null) {
                currentStock -= (findAllChild[i].sorties || 0)
              } else if (findAllChild[i].original_sorties !== null && findAllChild[i].entrees !== null) {
                currentStock -= (findAllChild[i].original_sorties || 0)
              }
            }

            if (currentStock === findAllChild[i].original_stock) {
              currentStock = null
            }

            if(currentStock !== null && currentStock < 0) {
              currentStock = 0
            }

            // save to database
            findAllChild[i].stock = currentStock
            await Model.updateById(findAllChild[i].id, {
              stock: currentStock,
            })
          }
        }

        const findMain = await Model.findOne({
          where: {
            periode: {
              [Op.between]: [startOfMonth(date), endOfMonth(date)],
            },
            hr_backup_id: hrBackupId,
            contentieux_id: ref.id,
          },
        })
        if (findMain) {
          await findMain.update(calculMainValuesFromChilds(findAllChild))
        } else {
          await Model.create({
            periode: date,
            hr_backup_id: hrBackupId,
            contentieux_id: ref.id,
            ...calculMainValuesFromChilds(findAllChild),
          })
        }

        // check if they are value after this periode
        const nextPeriode = await Model.findAll({
          attributes: ['periode'],
          where: {
            periode: {
              [Op.gt]: endOfMonth(date),
            },
            hr_backup_id: hrBackupId,
            contentieux_id: [ref.id].concat(ref.childrens.map((r) => r.id)),
          },
          raw: true,
          order: ['periode'],
        })
        continueToDo = nextPeriode.length !== 0
        if (nextPeriode.length) {
          date.setMonth(date.getMonth() + 1)
        }
      } while (continueToDo)
    }
  }

  // check if they are a stock before, set by user, and find it. If this is multiple month ago then update all month between them.
  Model.checkAndUpdatePreviousStock = async (
    contentieuxId,
    periode,
    backupId
  ) => {
    const startOfMonthPeriode = startOfMonth(periode)

    const previousPeriode = await Model.findAll({
      attributes: ['periode', 'stock', 'original_stock'],
      where: {
        periode: {
          [Op.lt]: startOfMonthPeriode,
        },
        [Op.or]: [
          {
            stock: {
              [Op.ne]: null,
            },
          },
          {
            original_stock: {
              [Op.ne]: null,
            },
          },
        ],
        hr_backup_id: backupId,
        contentieux_id: contentieuxId,
      },
      raw: true,
      order: ['periode'],
    })

    if (previousPeriode.length) {
      if (previousPeriode[previousPeriode.length - 1].stock !== null) {
        return {
          stock: previousPeriode[previousPeriode.length - 1].stock,
          type: 'calculate',
        }
      } else if (
        previousPeriode[previousPeriode.length - 1].original_stock === null
      ) {
        return null
      } else if (previousPeriode[previousPeriode.length - 1].original_stock !== null) {
        return {
          stock: previousPeriode[previousPeriode.length - 1].original_stock,
          type: 'setted',
        }
      }
    }
    return null
  }

  Model.getByMonth = async (date, HrBackupId) => {
    date = new Date(date)

    const list = await Model.findAll({
      attributes: [
        'id',
        'periode',
        'entrees',
        'sorties',
        'stock',
        ['original_entrees', 'originalEntrees'],
        ['original_sorties', 'originalSorties'],
        ['original_stock', 'originalStock'],
      ],
      where: {
        hr_backup_id: HrBackupId,
        periode: {
          [Op.between]: [startOfMonth(date), endOfMonth(date)],
        },
      },
      include: [
        {
          model: Model.models.ContentieuxReferentiels,
        },
      ],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        periode: list[i].periode,
        entrees: list[i].entrees,
        originalEntrees: list[i].originalEntrees,
        sorties: list[i].sorties,
        originalSorties: list[i].originalSorties,
        stock: list[i].stock,
        originalStock: list[i].originalStock,
        contentieux: {
          id: list[i]['ContentieuxReferentiel.id'],
          label: list[i]['ContentieuxReferentiel.label'],
        },
        updatedBy: {
          entrees: await Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(list[i].id, 'entrees'),
          sorties: await Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(list[i].id, 'sorties'),
          stock: await Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(list[i].id, 'stock'),
        },
      }
    }

    return list
  }

  return Model
}