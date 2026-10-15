import { Op } from 'sequelize'

/**
 * Liste des actitiés d'une sitution d'un magistrat
 */

export default (sequelizeInstance, Model) => {

  Model.getDefaultBackup = async (HRActivityId) => {
    const item = await Model.findOne({
      where: {
        hr_situation_id: HRActivityId,
      },
      include: [
        {
          model: Model.models.HRSituations,
          attributes: ['id'],
          required: true,
          include: [{
            model: Model.models.HumanResources,
            attributes: ['backup_id'],
            required: true,
            include: [{
              model: Model.models.HRBackups,
              attributes: ['id', 'label'],
              required: true,
            }],
          }],
        }],
      raw: true,
    })

    return item && item['HRSituation.HumanResource.backup_id'] ? {
      id: item['HRSituation.HumanResource.backup_id'],
      label: item['HRSituation.HumanResource.HRBackup.label'],
    } : null
  }

  /**
   * Liste des activitiés d'une situatioj
   * @param {*} HRActivityId
   * @returns
   */
  Model.getAll = async (HRActivityId) => {
    let list = await Model.findAll({
      attributes: ['id', 'percent', 'updated_at', 'backup_id'],
      where: {
        hr_situation_id: HRActivityId,
      },
      include: [
        {
          required: true,
          model: Model.models.ContentieuxReferentiels,
        },
        {
          model: Model.models.HRBackups,
          attributes: ['id', 'label'],
        },
      ],
      raw: true,
    })

    const defaultBackup = await Model.getDefaultBackup(HRActivityId)

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        percent: list[i].percent,
        updated_at: list[i].updated_at,
        backupId: list[i].backup_id || defaultBackup?.id,
        contentieux: {
          id: list[i]['ContentieuxReferentiel.id'],
          label: list[i]['ContentieuxReferentiel.label'],
        },
        backup: list[i]['HRBackup.id'] ? {
          id: list[i]['HRBackup.id'],
          label: list[i]['HRBackup.label'],
        } : defaultBackup ? {
          id: defaultBackup.id,
          label: defaultBackup.label,
        } : null,
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
        backup_id: hRActivity.backupId || hRActivity.backup?.id || null,
      }
      let findToBdd = await Model.findOne({
        where: {
          nac_id: contentieuxId,
          hr_situation_id: hRSituationId,
          backup_id: options.backup_id,
        },
      })

      if (findToBdd) {
        await findToBdd.update(options)
      } else {
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
      await Model.destroyById(oldNewHRList[i])
    }
  }

  Model.syncAllVentilationByContentieux = async (contentieuxId) => {
    const listAllMainContentieux = await Model.findAll({
      where: {
        nac_id: {
          [Op.gt]: 0,
        },
        nac_id: contentieuxId,
      },
    })

    const refElements = {}
    for (let i = 0; i < listAllMainContentieux.length; i++) {
      // get juridiction id
      const juridiction = await Model.models.HumanResources.findOne({
        attributes: ['id', 'backup_id'],
        include: [
          {
            attributes: [],
            model: Model.models.HRSituations,
            include: [
              {
                attributes: ['id'],
                model: Model.models.HRActivities,
                where: {
                  id: listAllMainContentieux[i].dataValues.id,
                },
              },
            ],
          },
        ],
        raw: true,
      })

      if (juridiction && juridiction.backup_id) {
        const juridictionId = juridiction.backup_id
        if (!refElements[juridictionId]) {
          refElements[juridictionId] = await Model.models.ContentieuxReferentiels.getReferentiels(juridictionId)
        }

        const referentiel = refElements[juridictionId]
        const findRef = referentiel.find((r) => r.id === contentieuxId)
        if (findRef && findRef.childrens.length) {
          const refIds = findRef.childrens.map((c) => c.id)

          const sum = await Model.sum('percent', {
            where: {
              hr_situation_id: listAllMainContentieux[i].dataValues.hr_situation_id,
              nac_id: refIds,
            },
          })

          listAllMainContentieux[i].update({
            percent: sum || listAllMainContentieux[i].dataValues.percent,
          })
        }
      }
    }
  }

  return Model
}
