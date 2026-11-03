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

  /**
   * Agents dont une activité est ventilée sur une des juridictions demandées.
   * @param {number[]} backupIds
   * @returns {Promise<Array<{ id: number, backupId: number }>>}
   */
  Model.listHumanResourcesByActivityBackupIds = async (backupIds) => {
    if (!Array.isArray(backupIds) || backupIds.length === 0) {
      return []
    }

    return sequelizeInstance.query(
      `
        SELECT DISTINCT hr.id, hr.backup_id AS "backupId"
        FROM "HRActivities" act
        INNER JOIN "HRSituations" sit ON sit.id = act.hr_situation_id AND sit.deleted_at IS NULL
        INNER JOIN "HumanResources" hr ON hr.id = sit.human_id AND hr.deleted_at IS NULL
        WHERE act.deleted_at IS NULL
          AND act.backup_id IN (:backupIds)
      `,
      {
        replacements: { backupIds },
        type: sequelizeInstance.QueryTypes.SELECT,
      },
    )
  }

  /**
   * Aligne le pourcentage d'un contentieux sur la somme de ses enfants directs.
   * Chaque ventilation (situation + juridiction) est recalculée à part.
   * Un enfant masqué pour la juridiction ne compte pas.
   * Sans aucune activité enfant, la valeur saisie sur le parent est conservée.
   * Le calcul remonte ensuite au parent, pour que chaque niveau reste la somme du sien.
   * @param {number} contentieuxId
   */
  Model.syncAllVentilationByContentieux = async (contentieuxId) => {
    const seen = new Set()

    const syncOne = async (id) => {
      if (!id || seen.has(id)) return
      seen.add(id)

      await sequelizeInstance.query(
        `
          WITH parents AS (
            SELECT
              act.id,
              act.hr_situation_id,
              COALESCE(act.backup_id, hr.backup_id) AS juridiction_id
            FROM "HRActivities" act
            INNER JOIN "HRSituations" sit
              ON sit.id = act.hr_situation_id AND sit.deleted_at IS NULL
            INNER JOIN "HumanResources" hr
              ON hr.id = sit.human_id AND hr.deleted_at IS NULL
            WHERE act.deleted_at IS NULL
              AND act.nac_id = :contentieuxId
          ),
          children AS (
            SELECT id, only_to_hr_backup
            FROM "ContentieuxReferentiels"
            WHERE deleted_at IS NULL
              AND parent_id = :contentieuxId
          ),
          child_totals AS (
            SELECT
              c.hr_situation_id,
              COALESCE(c.backup_id, hr.backup_id) AS juridiction_id,
              c.nac_id,
              SUM(c.percent) AS total
            FROM "HRActivities" c
            INNER JOIN "HRSituations" sit
              ON sit.id = c.hr_situation_id AND sit.deleted_at IS NULL
            INNER JOIN "HumanResources" hr
              ON hr.id = sit.human_id AND hr.deleted_at IS NULL
            WHERE c.deleted_at IS NULL
              AND c.nac_id IN (SELECT id FROM children)
            GROUP BY c.hr_situation_id, COALESCE(c.backup_id, hr.backup_id), c.nac_id
          ),
          next_values AS (
            SELECT
              p.id,
              COALESCE(SUM(ct.total) FILTER (
                WHERE ch.only_to_hr_backup IS NULL
                  OR (p.juridiction_id IS NOT NULL AND ch.only_to_hr_backup @> ARRAY[p.juridiction_id]::integer[])
              ), 0) AS percent
            FROM parents p
            INNER JOIN children ch ON TRUE
            LEFT JOIN child_totals ct
              ON ct.hr_situation_id = p.hr_situation_id
              AND ct.juridiction_id IS NOT DISTINCT FROM p.juridiction_id
              AND ct.nac_id = ch.id
            GROUP BY p.id
            HAVING COUNT(ct.nac_id) > 0
          )
          UPDATE "HRActivities" act
          SET percent = next_values.percent,
              updated_at = NOW()
          FROM next_values
          WHERE act.id = next_values.id
            AND act.percent IS DISTINCT FROM next_values.percent
        `,
        {
          replacements: { contentieuxId: id },
          type: sequelizeInstance.QueryTypes.UPDATE,
        },
      )

      const node = await Model.models.ContentieuxReferentiels.findOne({
        attributes: ['parent_id'],
        where: { id },
        raw: true,
      })
      if (node?.parent_id) await syncOne(node.parent_id)
    }

    await syncOne(contentieuxId)
  }

  return Model
}
