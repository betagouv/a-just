import { Op } from 'sequelize'
import { today } from '../utils/date'

export default (sequelizeInstance, Model) => {
  Model.getAllByHR = async (HRId) => {
    const list = await Model.findAll({
      attributes: ['id', 'percent', 'date_start', 'date_stop'],
      where: {
        hr_id: HRId,
      },
      include: [
        {
          model: Model.models.ContentieuxReferentiels,
        },
      ],
      order: [['date_start', 'desc']],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        percent: list[i].percent,
        dateStart: list[i].date_start,
        dateStartTimesTamps: today(list[i].date_start).getTime(),
        dateStop: list[i].date_stop,
        dateStopTimesTamps: today(list[i].date_stop).getTime(),
        contentieux: {
          id: list[i]['ContentieuxReferentiel.id'],
          label: list[i]['ContentieuxReferentiel.label'],
        },
      }
    }

    return list
  }

  Model.syncIndisponibilites = async (indisponibilities, hRId) => {
    let reelHRIds = []

    for (let i = 0; i < indisponibilities.length; i++) {
      const indispo = indisponibilities[i] 
      console.log(indispo)

      const options = {
        nac_id: indispo.contentieux.id,
        hr_id: hRId,
        percent: indispo.percent,
        date_start: indispo.dateStart,
        date_stop: indispo.dateStop,
      }
      let findToBdd

      if (indispo.id > 0) {
        await Model.updateById(indispo.id, options)
        reelHRIds.push(indispo.id)
      } else {
        findToBdd = await Model.create({
          ...options,
        })
        reelHRIds.push(findToBdd.dataValues.id)
      }
    }

    // remove old HR
    const oldNewHRList = (
      await Model.findAll({
        attributes: ['id'],
        where: {
          hr_id: hRId,
          id: {
            [Op.notIn]: reelHRIds,
          },
        },
        raw: true,
      })
    ).map((h) => h.id)
    for (let i = 0; i < oldNewHRList.length; i++) {
      await Model.destroyById(oldNewHRList[i])
    }
  }

  return Model
}
