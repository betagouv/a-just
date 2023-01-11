import { Op } from 'sequelize'
import { today } from '../utils/date'

/**
 * Liste des situations des fiches (situation = catégorie, fonction, etp, ...)
 */

export default (sequelizeInstance, Model) => {
  /**
   * Liste des situations d'une fiche à partir d'une date donnée
   * @param {*} humanId
   * @param {*} dateStart
   * @returns
   */
  Model.getListByHumanId = async (humanId, dateStart) => {
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
      order: [['date_start', 'desc']],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        etp: list[i].etp,
        dateStart: list[i].date_start,
        dateStartTimesTamps: today(list[i].date_start).getTime(),
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
        activities: await Model.models.HRActivities.getAll(list[i].id),
      }
    }

    // create artificial situation if date start if before the first situation
    if (dateStart && list.length && today(dateStart) < today(list[0].dateStart)) {
      list.push({
        etp: 1,
        dateStart: today(dateStart),
        dateStartTimesTamps: today(dateStart).getTime(),
        category: list[0].category,
        fonction: list[0].fonction,
        activities: [],
      })
    }

    return list
  }

  /**
   * Mise à jour des sitations d'une fiche
   * @param {*} list
   * @param {*} humanId
   * @param {*} cleanOldSituation
   */
  Model.syncSituations = async (list, humanId, cleanOldSituation = false) => {
    let reelHRIds = []

    if (cleanOldSituation) {
      await Model.destroy({
        where: {
          human_id: humanId,
        },
      })
    }

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
        console.log(options, humanId)
        findToBdd = await Model.create({
          ...options,
          human_id: humanId,
        })
      }

      reelHRIds.push(findToBdd.id)

      await Model.models.HRActivities.syncHRActivities(situation.activities || [], findToBdd.id)
    }

    // remove old HR
    const oldNewHRList = (
      await Model.findAll({
        attributes: ['id'],
        where: {
          human_id: humanId,
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

  /**
   * Control si un utilisateur a accès à la situation d'une fiche
   * @param {*} situationId
   * @param {*} userId
   * @returns
   */
  Model.haveHRId = async (situationId, userId) => {
    const hr = await Model.findOne({
      attributes: ['id'],
      where: {
        id: situationId,
      },
      include: [
        {
          attributes: ['id'],
          model: Model.models.HumanResources,
          include: [
            {
              attributes: ['id'],
              model: Model.models.HRBackups,
              include: [
                {
                  attributes: ['id'],
                  model: Model.models.UserVentilations,
                  where: {
                    user_id: userId,
                  },
                },
              ],
            },
          ],
        },
      ],
      raw: true,
    })

    return hr ? hr['HumanResource.id'] : null
  }

  return Model
}
