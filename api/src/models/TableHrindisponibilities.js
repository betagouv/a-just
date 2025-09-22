import { Op } from 'sequelize'
import { today } from '../utils/date'

/**
 * Liste des indispo d'une fiche
 */

export default (sequelizeInstance, Model) => {
  /**
   * Liste des indispo d'une fiches
   * @param {*} HRId
   * @returns
   */
  Model.getAllByHR = async (HRId) => {
    const list = await Model.findAll({
      attributes: ['id', 'percent', 'date_start', 'date_stop', 'created_at', 'updated_at'],
      where: {
        hr_id: HRId,
      },
      include: [
        {
          required: true,
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
        dateStop: list[i].date_stop,
        dateStopTimesTamps: list[i].date_stop ? today(list[i].date_stop).getTime() : null,
        createdAt: list[i].created_at,
        updatedAt: list[i].updated_at,
        contentieux: {
          id: list[i]['ContentieuxReferentiel.id'],
          label: list[i]['ContentieuxReferentiel.label'],
          checkVentilation: list[i]['ContentieuxReferentiel.check_ventilation'],
        },
      }
    }

    return list
  }

  /**
   * Mise à jour des indispo d'une fiche
   * @param {*} indisponibilities
   * @param {*} hRId
   */
  Model.syncIndisponibilites = async (indisponibilities, hRId) => {
    let reelHRIds = []

    for (let i = 0; i < indisponibilities.length; i++) {
      const indispo = indisponibilities[i]

      const options = {
        nac_id: indispo.contentieux.id,
        hr_id: hRId,
        percent: indispo.percent,
        date_start: indispo.dateStart || null,
        date_stop: indispo.dateStop || null,
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
