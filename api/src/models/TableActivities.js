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
    for (let i = 0; i < csv.length; i++) {
      const contentieux = await Model.models.ContentieuxReferentiels.findOne({
        attributes: ['id'],
        where: {
          label: csv[i].niveau_4,
        },
        raw: true,
      })

      if (contentieux) {
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
            contentieux_id: contentieux.id,
            periode: {
              [Op.gte]: periodeStart,
              [Op.lte]: periodeEnd,
            },
          },
        })
        // if existe update content
        if (findExist) {
          await findExist.update({
            entrees: parseInt(csv[i].value_entrees) || 0,
            sorties: parseInt(csv[i].value_sorties) || 0,
            stock: parseInt(csv[i].value_stock) || 0,
          })
        } else {
          // else create
          await Model.create({
            hr_backup_id: HRBackupId,
            periode,
            contentieux_id: contentieux.id,
            entrees: parseInt(csv[i].value_entrees) || 0,
            sorties: parseInt(csv[i].value_sorties) || 0,
            stock: parseInt(csv[i].value_stock) || 0,
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
          for(let y = 0; y < ref.length; y++) {
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

  Model.populateMainActivity = async ({ HRBackupId, contentieuxId, periode }) => {
    console.log('populateMainActivity', HRBackupId, contentieuxId, periode)
    const refDb = (await Model.models.ContentieuxReferentiels.getReferentiels()).find(r => r.id === contentieuxId)
    if(!refDb) {
      return false
    }

    const periodeStart = new Date(periode.getFullYear(), periode.getMonth())
    const periodeEnd = new Date(periodeStart)
    periodeEnd.setMonth(periodeEnd.getMonth() + 1)
    let childrensIds = refDb.childrens && refDb.childrens.length ? refDb.childrens.map(rd => (rd.id)) : refDb.id    

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
      entrees: await Model.sum('entrees', {
        where: optionsWhere,
      }) || 0,
      sorties: await Model.sum('sorties', {
        where: optionsWhere,
      }) || 0,
      stock: await Model.sum('stock', {
        where: optionsWhere,
      }) || 0,
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
    if(findExist) {
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

  return Model
}
