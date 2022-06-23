import { Op } from 'sequelize'

export default (sequelizeInstance, Model) => {
  Model.getAll = async (HRBackupId) => {
    const list = await Model.findAll({
      attributes: ['periode', 'entrees', 'sorties', 'stock'],
      where: {
        hr_backup_id: HRBackupId,
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
        sorties: list[i].sorties,
        stock: list[i].stock,
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

      if(!contentieuxIds[code]) {
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
        const periode = new Date(csv[i].periode)
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
        if (findExist && 
            (parseInt(csv[i].entrees) !== findExist.dataValues.entrees || 
            parseInt(csv[i].sorties) !== findExist.dataValues.sorties || 
            parseInt(csv[i].stock) !== findExist.dataValues.stock)
        ) {
          await findExist.update({
            entrees: parseInt(csv[i].entrees) || 0,
            sorties: parseInt(csv[i].sorties) || 0,
            stock: parseInt(csv[i].stock) || 0,
          })
        } else {
          // else create
          await Model.create({
            hr_backup_id: HRBackupId,
            periode,
            contentieux_id: contentieuxIds[code],
            entrees: parseInt(csv[i].entrees) || 0,
            sorties: parseInt(csv[i].sorties) || 0,
            stock: parseInt(csv[i].stock) || 0,
          })
        }
      }
    }

    await Model.cleanActivities(HRBackupId)
  }

  Model.cleanActivities = async (HRBackupId) => {
    const ref = await Model.models.ContentieuxReferentiels.getReferentiels()

    for (let i = 0; i < ref.length; i++) {
      const activities = await Model.findAll({
        attributes: ['periode', 'contentieux_id'],
        where: {
          hr_backup_id: HRBackupId,
        },
        raw: true,
      })

      for (let x = 0; x < activities.length; x++) {
        // if main activity find populate with child
        if (ref.find((r) => r.id === activities[x].contentieux_id)) {
          await Model.populateMainActivity({
            HRBackupId,
            contentieuxId: activities[x].contentieux_id,
            periode: activities[x].periode,
          })
        } else {
          // if childreen, create parent en populate
          for (let y = 0; y < ref.length; y++) {
            const findChild = (ref[y].childrens || []).find(
              (c) => c.id === activities[x].contentieux_id
            )
            if (findChild) {
              await Model.populateMainActivity({
                HRBackupId,
                contentieuxId: ref[y].id,
                periode: activities[x].periode,
              })
              break
            }
          }
        }
      }
    }
  }

  Model.populateMainActivity = async ({
    HRBackupId,
    contentieuxId,
    periode,
  }) => {
    console.log('populateMainActivity', HRBackupId, contentieuxId, periode)
    const refDb = (
      await Model.models.ContentieuxReferentiels.getReferentiels()
    ).find((r) => r.id === contentieuxId)
    if (!refDb) {
      return false
    }

    const periodeStart = new Date(periode.getFullYear(), periode.getMonth())
    const periodeEnd = new Date(periodeStart)
    periodeEnd.setMonth(periodeEnd.getMonth() + 1)
    let childrensIds =
      refDb.childrens && refDb.childrens.length
        ? refDb.childrens.map((rd) => rd.id)
        : refDb.id

    const optionsWhere = {
      hr_backup_id: HRBackupId,
      contentieux_id: childrensIds,
      periode: {
        [Op.gte]: periodeStart,
        [Op.lte]: periodeEnd,
      },
    }

    // find all
    const options = {
      entrees:
        (await Model.sum('entrees', {
          where: optionsWhere,
        })) || 0,
      sorties:
        (await Model.sum('sorties', {
          where: optionsWhere,
        })) || 0,
      stock:
        (await Model.sum('stock', {
          where: optionsWhere,
        })) || 0,
    }

    // if main activity find populate with child
    const findExist = await Model.findOne({
      where: {
        hr_backup_id: HRBackupId,
        contentieux_id: contentieuxId,
        periode: {
          [Op.gte]: periodeStart,
          [Op.lte]: periodeEnd,
        },
      },
    })
    if (findExist) {
      await findExist.update(options)
    } else {
      await Model.create({
        hr_backup_id: HRBackupId,
        contentieux_id: contentieuxId,
        periode,
        ...options,
      })
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

  Model.updateBy = async (contentieuxId, date, values, hrBackupId) => {
    date = new Date(date)
    const dateStart = new Date(date.getFullYear(), date.getMonth())
    const dateStop = new Date(dateStart)
    dateStop.setMonth(dateStop.getMonth() + 1)

    const findActivity = await Model.findOne({
      where: {
        periode: {
          [Op.gte]: dateStart,
          [Op.lte]: dateStop,
        },
        hr_backup_id: hrBackupId,
        contentieux_id: contentieuxId,
      },
    })

    if(findActivity) {
      await findActivity.update(values)
    } else {
      await Model.create({
        ...values,
        hr_backup_id: hrBackupId,
        contentieux_id: contentieuxId,
        periode: date,
      })
    }
  }

  return Model
}
