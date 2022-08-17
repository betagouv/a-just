import { sumBy } from 'lodash'
import { Op } from 'sequelize'

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

        const periodeStart = new Date(
          periode.getFullYear(),
          periode.getMonth()
        )
        const periodeEnd = new Date(periodeStart)
        periodeEnd.setMonth(periodeEnd.getMonth() + 1)

        const findExist = await Model.findOne({
          where: {
            hr_backup_id: HRBackupId,
            contentieux_id: contentieuxIds[code],
            periode: {
              [Op.gte]: periodeStart,
              [Op.lte]: periodeEnd,
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

  Model.cleanActivities = async (HRBackupId) => {
    const ref = await Model.models.ContentieuxReferentiels.getReferentiels()
    const activitiesPeriodes = (
      await Model.findAll({
        attributes: ['periode'],
        where: {
          hr_backup_id: HRBackupId,
        },
        group: ['periode'],
        raw: true,
      })
    ).map((d) => d.periode)

    console.log(activitiesPeriodes)

    for (let i = 0; i < ref.length; i++) {
      const referentiel = ref[i]

      if (referentiel.childrens && referentiel.childrens.length) {
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
              periode,
              hr_backup_id: HRBackupId,
              contentieux_id: referentiel.childrens.map((r) => r.id),
            },
            raw: true,
          })

          const findMainActivity = await Model.findOne({
            where: {
              periode,
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
    const dateStart = new Date(date.getFullYear(), date.getMonth())
    const dateStop = new Date(dateStart)
    dateStop.setMonth(dateStop.getMonth() + 1)

    let findActivity = await Model.findOne({
      where: {
        periode: {
          [Op.gte]: dateStart,
          [Op.lte]: dateStop,
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

    await Model.models.HistoriesActivitiesUpdate.addHistory(
      userId,
      findActivity.dataValues.id
    )
  }

  Model.getByMonth = async (date, HrBackupId) => {
    date = new Date(date)
    const dateStart = new Date(date.getFullYear(), date.getMonth())
    const dateStop = new Date(dateStart)
    dateStop.setMonth(dateStop.getMonth() + 1)

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
          [Op.gte]: dateStart,
          [Op.lte]: dateStop,
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
    }

    return list
  }

  return Model
}
