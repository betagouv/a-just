import { Op } from 'sequelize'

export default (sequelizeInstance, Model) => {
  Model.getAll = async (backupId) => {
    const list = await Model.findAll({
      attributes: ['periode', 'entrees', 'sorties', 'stock'],
      where: {
        backup_id: backupId,
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

  Model.importList = async (csv, juridictionId, backupId, backupName) => {
    if (backupName) {
      backupId = await Model.models.ActivitiesBackups.getNewBackupId(
        backupName,
        { juridiction_id: juridictionId }
      )
    }

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
            backup_id: backupId,
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
            entrees: csv[i].value_entrees,
            sorties: csv[i].value_sorties,
            stock: csv[i].value_stock,
          })
        } else {
          // else create
          await Model.create({
            backup_id: backupId,
            periode,
            contentieux_id: contentieux.id,
            entrees: csv[i].value_entrees,
            sorties: csv[i].value_sorties,
            stock: csv[i].value_stock,
          })
        }
      }
    }

    await Model.cleanActivities(backupId)
  }

  Model.cleanActivities = async (backupId) => {
    const ref = await Model.models.ContentieuxReferentiels.getReferentiels()

    for (let i = 0; i < ref.length; i++) {
      const activities = await Model.findAll({
        attributes: ['periode', 'contentieux_id'],
        where: {
          backup_id: backupId,
        },
        raw: true,
      })

      for (let x = 0; x < activities.length; x++) {
        // if main activity find populate with child
        if (ref.find((r) => r.id === activities[x].contentieux_id)) {
          await Model.populateMainActivity({
            backupId,
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
                backupId,
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

  Model.populateMainActivity = async ({ backupId, contentieuxId, periode }) => {
    const refDb = (await Model.models.ContentieuxReferentiels.getReferentiels()).find(r => r.id === contentieuxId)
    if(!refDb) {
      return false
    }

    const periodeStart = new Date(periode.getFullYear(), periode.getMonth())
    const periodeEnd = new Date(periodeStart)
    periodeEnd.setMonth(periodeEnd.getMonth() + 1)
    let childrensIds = refDb.childrens && refDb.childrens.length ? refDb.childrens.map(rd => (rd.id)) : refDb.id    

    const optionsWhere = {
      backup_id: backupId,
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
      }),
      sorties: await Model.sum('sorties', {
        where: optionsWhere,
      }),
      stock: await Model.sum('stock', {
        where: optionsWhere,
      }),
    }


    // if main activity find populate with child
    const findExist = await Model.findOne({
      where: {
        backup_id: backupId,
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
        backup_id: backupId,
        contentieux_id: contentieuxId,
        periode,
        ...options,
      })
    }
  }

  return Model
}
