import { endOfMonth, startOfMonth } from 'date-fns'
import { sumBy } from 'lodash'
import { Op } from 'sequelize'
import { calculMainValuesFromChilds } from '../utils/activities'

export default (sequelizeInstance, Model) => {
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
        entrees: list[i].entrees !== null ? list[i].entrees : list[i].original_entrees,
        sorties: list[i].sorties !== null ? list[i].sorties : list[i].original_sorties,
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

        const findExist = await Model.findOne({
          where: {
            hr_backup_id: HRBackupId,
            contentieux_id: contentieuxIds[code],
            periode: {
              [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
            },
          },
        })

        // if existe update content
        if (
          findExist &&
          (parseInt(csv[i].entrees) !== findExist.dataValues.original_entrees ||
            parseInt(csv[i].sorties) !==
              findExist.dataValues.original_sorties ||
            parseInt(csv[i].stock) !== findExist.dataValues.original_stock)
        ) {
          await findExist.update({
            original_entrees: parseInt(csv[i].entrees) || 0,
            original_sorties: parseInt(csv[i].sorties) || 0,
            original_stock: parseInt(csv[i].stock) || 0,
          })
        } else if (!findExist) {
          // else create
          await Model.create({
            hr_backup_id: HRBackupId,
            periode,
            contentieux_id: contentieuxIds[code],
            original_entrees: parseInt(csv[i].entrees) || 0,
            original_sorties: parseInt(csv[i].sorties) || 0,
            original_stock: parseInt(csv[i].stock) || 0,
          })
        }
      }
    }

    await Model.cleanActivities(HRBackupId)
  }

  Model.removeDuplicateDatas = async (HRBackupId) => {
    const activities = await Model.findAll({
      attributes: [
        'periode',
        'contentieux_id',
        'hr_backup_id',
      ],
      where: {
        hr_backup_id: HRBackupId,
      },
      group: ['periode', 'contentieux_id', 'hr_backup_id'],
      raw: true,
    })

    for(let i = 0; i < activities.length; i++) {
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

      if(duplicateActivities.length >= 2) {
        for(let z = 1; z < duplicateActivities.length; z++) {
          await duplicateActivities[z].destroy()
        }
      }
    }

  }

  Model.cleanActivities = async (HRBackupId) => {
    const ref = await Model.models.ContentieuxReferentiels.getReferentiels()
    
    for (let i = 0; i < ref.length; i++) {
      const referentiel = ref[i]

      // find all periode
      const activitiesPeriodes = (
        await Model.findAll({
          where: {
            hr_backup_id: HRBackupId,
            contentieux_id: referentiel.childrens.map((r) => r.id),
          },
          group: ['periode', 'id'],
          order: [['periode', 'desc']],
          raw: true,
        })
      ).map((d) => d.periode)

      for (let p = 0; p < activitiesPeriodes.length; p++) {
        const periode = activitiesPeriodes[p]

        const activities = await Model.findAll({
          attributes: [
            'entrees',
            'sorties',
            'stock',
            'original_entrees',
            'original_sorties',
            'original_stock',
            'periode',
            'contentieux_id',
          ],
          where: {
            periode: {
              [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
            },
            hr_backup_id: HRBackupId,
            contentieux_id: referentiel.childrens.map((r) => r.id),
          },
          raw: true,
        })


        const findMainActivity = await Model.findOne({
          where: {
            periode: {
              [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
            },
            hr_backup_id: HRBackupId,
            contentieux_id: referentiel.id,
          },
        })

        const options = {
          entrees: sumBy(activities, 'entrees') || null,
          sorties: sumBy(activities, 'sorties') || null,
          stock: sumBy(activities, 'stock') || null,
          original_entrees: sumBy(activities, 'original_entrees') || null,
          original_sorties: sumBy(activities, 'original_sorties') || null,
          original_stock: sumBy(activities, 'original_stock') || null,
        }

        if (findMainActivity) {          
          await findMainActivity.update(options)
        } else {
          await Model.create({
            ...options,
            periode,
            hr_backup_id: HRBackupId,
            contentieux_id: referentiel.id,
          })
        }
      }
    }
  }

  Model.saveBackup = async (list, hrBackupId) => {
    let reelIds = []

    for (let x = 0; x < list.length; x++) {
      const op = list[x]

      const options = {
        contentieux_id: op.contentieux.id,
        periode: op.periode,
        entrees: op.entrees,
        sorties: op.sorties,
        stock: op.stock,
        hr_backup_id: hrBackupId,
      }

      if (op.id && op.id > 0) {
        // update
        await Model.updateById(op.id, options)
      } else {
        // create
        const newOp = await Model.create(options)
        op.id = newOp.dataValues.id
      }

      reelIds.push(op.id)
    }

    // remove old
    const oldNewList = (
      await Model.models.Activities.findAll({
        attributes: ['id'],
        where: {
          hr_backup_id: hrBackupId,
        },
        raw: true,
      })
    ).map((h) => h.id)
    for (let i = 0; i < oldNewList.length; i++) {
      if (reelIds.indexOf(oldNewList[i]) === -1) {
        await Model.destroyById(oldNewList[i])
      }
    }
  }

  Model.updateBy = async (contentieuxId, date, values, hrBackupId, userId) => {
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

    if(userId !== null) {
      await Model.models.HistoriesActivitiesUpdate.addHistory(
        userId,
        findActivity.dataValues.id
      )
    }

    // update main activity in and out only
    const referentiels = await Model.models.ContentieuxReferentiels.getReferentiels()
    const ref = referentiels.find(r => (r.childrens || []).find(c => c.id === contentieuxId))
    console.log(ref)
    if(ref) {
      const findAllChild = await Model.findAll({
        where: {
          periode: {
            [Op.between]: [startOfMonth(date), endOfMonth(date)],
          },
          hr_backup_id: hrBackupId,
          contentieux_id: ref.childrens.map(r => r.id),
        },
        raw: true,
      })
      const findMain = await Model.findOne({
        where: {
          periode: {
            [Op.between]: [startOfMonth(date), endOfMonth(date)],
          },
          hr_backup_id: hrBackupId,
          contentieux_id: ref.id,
        },
      })
      if(findMain) {
        await findMain.update(calculMainValuesFromChilds(findAllChild))
      }
    }
  }

  Model.getByMonth = async (date, HrBackupId, loadPreviousList = true) => {
    date = new Date(date)

    const lastMonth = new Date(date)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    let previousList

    if(loadPreviousList) {
      const previous = await Model.getByMonth(lastMonth, HrBackupId, false)
      previousList = previous.list
    }

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
      }

      if(loadPreviousList && list[i].stock == null) {
        // calculate last month
        // TODO
      }
    }

    return {
      list,
      previousList,
    }
  }

  return Model
}
