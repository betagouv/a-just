import { Op } from 'sequelize'

export default (sequelizeInstance, Model) => {
  Model.getListByHumanId = async (humanId) => {
    const list = await Model.findAll({
      attributes: ['id', 'etp', 'date_start', 'category_id', 'fonction_id'],
      where: {
        human_id: humanId,
      },
      include: [
        {
          attributes: ['id', 'rank', 'label'],
          model: Model.models.HRCategories,
        },
        {
          attributes: ['id', 'rank', 'code', 'label'],
          model: Model.models.HRFonctions,
        },
      ],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        etp: list[i].etp,
        dateStart: list[i].date_start,
        category: {
          id: list[i]['HRCategory.id'],
          rank: list[i]['HRCategory.rank'],
          code: list[i]['HRCategory.code'],
          label: list[i]['HRCategory.label'],
        },
        fonction: {
          id: list[i]['HRFonction.id'],
          rank: list[i]['HRFonction.rank'],
          code: list[i]['HRFonction.code'],
          label: list[i]['HRFonction.label'],
        },
      }
    }

    return list
  }

  Model.syncSituations = async (list, humanId) => {
    let reelHRIds = []

    for (let i = 0; i < list.length; i++) {
      const situation = list[i]

      const options = {
        etp: situation.etp || 0,
        category_id: situation.category ? situation.category.id : 0,
        fonction_id: situation.fonction ? situation.fonction.id : 0,
        date_start: situation.dateStart,
      }
      let findToBdd = null
      if (list[i].id && list[i].id > 0) {
        // update
        findToBdd = await Model.findOne({
          where: {
            human_id: humanId,
            id: situation.id,
          },
        })
      }

      if (findToBdd) {
        await findToBdd.update(options)
      } else {
        findToBdd = await Model.create({
          ...options,
          human_id: humanId,
        })
      }
      reelHRIds.push(findToBdd.id)
    }

    // remove old HR
    const oldNewHRList = (await Model.findAll({
      attributes: ['id'],
      where: {
        human_id: humanId,
        id: {
          [Op.notIn]: reelHRIds,
        },
      },
      raw: true,
    })).map(h => (h.id))
    for(let i = 0; i < oldNewHRList.length; i++) {
      await Model.destroyById(oldNewHRList[i])
    }
  }

  return Model
}
