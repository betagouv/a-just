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
    const returnList = []
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
          attributes: ['id', 'rank', 'code', 'label', 'category_detail', 'position', 'calculatrice_is_active'],
          model: Model.models.HRFonctions,
        },
      ],
      order: [
        ['date_start', 'desc'],
        ['id', 'desc'],
      ],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      let dateS = today(list[i].date_start)
      if (dateS && today(dateStart).getTime() > today(dateS).getTime()) {
        dateS = today(dateStart)
      }

      if (!returnList.some((r) => today(r.dateStart).getTime() === today(dateS).getTime())) {
        returnList.push({
          id: list[i].id,
          etp: list[i].etp,
          dateStart: dateS,
          dateStartTimesTamps: dateS.getTime(),
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
            category_detail: list[i]['HRFonction.category_detail'],
            position: list[i]['HRFonction.position'],
            calculatriceIsActive: list[i]['HRFonction.calculatrice_is_active'],
          },
          activities: await Model.models.HRActivities.getAll(list[i].id),
        })
      }
    }

    return returnList
  }

  /**
   * Mise à jour des situations d'une fiche
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

  Model.destroySituationId = async (situationId) => {
    const hr = await Model.findOne({
      where: {
        id: situationId,
      },
      raw: true,
    })

    if (hr) {
      const situations = await Model.findAll({
        where: {
          human_id: hr.human_id,
        },
        raw: true,
      })

      for (let i = 0; i < situations.length; i++) {
        if (today(situations[i].date_start).getTime() === today(hr.date_start).getTime()) {
          await Model.destroyById(situations[i].id)
        }
      }
    }

    return true
  }

  return Model
}
