import { Op } from 'sequelize'

/**
 * Liste des actitiés d'une sitution d'un magistrat
 */

export default (sequelizeInstance, Model) => {
  /**
   * Liste des activitiés d'une situatioj
   * @param {*} HRActivityId
   * @returns
   */
  Model.getAll = async (HRActivityId) => {
    const list = await Model.findAll({
      attributes: ['id', 'percent'],
      where: {
        hr_situation_id: HRActivityId,
      },
      include: [
        {
          required: true,
          model: Model.models.ContentieuxReferentiels,
        },
      ],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        percent: list[i].percent,
        contentieux: {
          id: list[i]['ContentieuxReferentiel.id'],
          label: list[i]['ContentieuxReferentiel.label'],
        },
      }
    }

    return list
  }

  /**
   * Ajoute, modifie ou supprime des activités d'une situation
   * @param {*} HRActivities
   * @param {*} hRSituationId
   */
  Model.syncHRActivities = async (HRActivities, hRSituationId) => {
    let reelHRIds = []

    for (let i = 0; i < HRActivities.length; i++) {
      const hRActivity = HRActivities[i]
      const contentieuxId = hRActivity.contentieux ? hRActivity.contentieux.id : hRActivity.referentielId

      const options = {
        nac_id: contentieuxId,
        hr_situation_id: hRSituationId,
        percent: hRActivity.percent,
      }
      let findToBdd = (findToBdd = await Model.findOne({
        where: {
          nac_id: contentieuxId,
          hr_situation_id: hRSituationId,
        },
      }))

      if (findToBdd) {
        if (hRSituationId === 7418) {
          console.log('UPDATE', options)
        }
        await findToBdd.update(options)
      } else {
        if (hRSituationId === 7418) {
          console.log('CREATE', options)
        }
        findToBdd = await Model.create({
          ...options,
        })
      }
      reelHRIds.push(findToBdd.id)
    }

    // remove old HR
    const oldNewHRList = (
      await Model.findAll({
        attributes: ['id'],
        where: {
          hr_situation_id: hRSituationId,
          id: {
            [Op.notIn]: reelHRIds,
          },
        },
        raw: true,
      })
    ).map((h) => h.id)
    for (let i = 0; i < oldNewHRList.length; i++) {
      if (hRSituationId === 7418) {
        console.log('REMOVE', oldNewHRList[i])
      }
      await Model.destroyById(oldNewHRList[i])
    }
  }

  return Model
}
