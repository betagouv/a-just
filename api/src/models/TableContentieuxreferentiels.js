import { orderBy } from 'lodash'
import { Op } from 'sequelize'
import {
  filterReferentielsByVisibility,
  normalizeReferentielVisibility,
  REFERENTIEL_VISIBILITY_EXTRACTOR,
  referentielCAMappingIndex,
  referentielMappingIndex,
} from '../constants/referentiel'
import { extractCodeFromLabelImported, jirsRules } from '../utils/referentiel'
import { camel_to_snake } from '../utils/utils'
import config from 'config'
import { isTj } from '../utils/ca'

// Le pool Sequelize par défaut a 5 connexions : on en garde une pour la requête en cours.
const REFERENTIEL_DB_CONCURRENCY = 4

/**
 * Exécute `worker` sur chaque élément, avec au plus `limit` promesses en cours.
 * @param {Array} items
 * @param {number} limit
 * @param {(item: *, index: number) => Promise<*>} worker
 */
const mapWithConcurrency = async (items, limit, worker) => {
  if (!items.length) return []

  const results = new Array(items.length)
  let nextIndex = 0
  const workerCount = Math.min(limit, items.length)

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex
        nextIndex += 1
        results[index] = await worker(items[index], index)
      }
    }),
  )

  return results
}

/**
 * Écrit les rangs modifiés en une requête par paquet.
 * @param {*} sequelizeInstance
 * @param {Array<{ id: number, rank: number }>} assignments
 */
const writeReferentielRanks = async (sequelizeInstance, assignments) => {
  const chunkSize = 500

  for (let offset = 0; offset < assignments.length; offset += chunkSize) {
    const chunk = assignments.slice(offset, offset + chunkSize)
    const replacements = {}
    const valuesSql = chunk
      .map((item, index) => {
        replacements[`id${index}`] = item.id
        replacements[`rank${index}`] = item.rank
        return `(:id${index}::integer, :rank${index}::integer)`
      })
      .join(', ')

    await sequelizeInstance.query(
      `
        UPDATE "ContentieuxReferentiels" AS c
        SET rank = v.rank,
            updated_at = NOW()
        FROM (VALUES ${valuesSql}) AS v(id, rank)
        WHERE c.id = v.id
          AND c.deleted_at IS NULL
      `,
      {
        replacements,
        logging: false,
      },
    )
  }
}

/**
 * Scripts intermediaires des contentieux
 */

export default (sequelizeInstance, Model) => {
  /**
   * Retourne la liste du référentiel
   * @param {*} backupIds
   * @param {string|null} visibleIn partout (everywhere), extracteur (extractor), cockpit (cockpit) ou données d'activité (activity)
   * @param {boolean} isJirs
   * @param {*} filterReferentielsId
   * @param {boolean} displayAll
   * @param {boolean} extractorMode
   * @param {*} userId
   * @returns
   */
  Model.getReferentiels = async (
    backupIds = null,
    visibleIn = null,
    isJirs = false,
    filterReferentielsId = null,
    displayAll = false,
    extractorMode = false,
    userId = null,
  ) => {
    if (!Array.isArray(backupIds)) {
      backupIds = [backupIds]
    }

    let refIds = null
    let userPreview = null
    if (userId) {
      userPreview = await Model.models.Users.userPreview(userId)
      refIds = userPreview.referentielIds
    }

    if (backupIds) {
      const juridictions = await Model.models.HRBackups.findAll({
        where: {
          id: { [Op.in]: backupIds },
        },
      })
      if (juridictions.length > 0 && !displayAll) {
        isJirs = juridictions.some((j) => j.jirs)
      }
    }
    if (displayAll === true) {
      isJirs = true
    }

    const where = {}
    if (displayAll == false && backupIds.length > 0) {
      where[Op.or] = [
        {
          only_to_hr_backup: null,
        },
        {
          only_to_hr_backup: { [Op.contains]: backupIds },
        },
      ]
    }

    const rows = await Model.findAll({
      attributes: [
        'id',
        'label',
        'code_import',
        'rank',
        'parent_id',
        ['value_quality_in', 'valueQualityIn'],
        ['value_quality_out', 'valueQualityOut'],
        ['value_quality_stock', 'valueQualityStock'],
        ['help_url', 'helpUrl'],
        'compter',
        'category',
        ['only_to_hr_backup', 'onlyToHrBackup'],
        ['check_ventilation', 'checkVentilation'],
        ['visible_in', 'visibleIn'],
      ],
      where,
      order: [['rank', 'asc']],
      raw: true,
    })

    const toIdList = (value) => (Array.isArray(value) ? value : [value])
    let allowedLevel3Ids = null
    if (displayAll == false && filterReferentielsId) {
      allowedLevel3Ids = toIdList(filterReferentielsId)
    }
    if (refIds) {
      allowedLevel3Ids = [...(allowedLevel3Ids || []), ...toIdList(refIds)]
    }
    const allowedLevel3Set = allowedLevel3Ids ? new Set(allowedLevel3Ids) : null

    const byParent = new Map()
    for (const row of rows) {
      const parentId = row.parent_id ?? null
      delete row.parent_id
      if (!byParent.has(parentId)) byParent.set(parentId, [])
      byParent.get(parentId).push(row)
    }

    const formatToGraph = (parentId = null, index = 0) => {
      let list = byParent.get(parentId) || []
      if (allowedLevel3Set && index === 2) {
        list = list.filter((node) => allowedLevel3Set.has(node.id))
      }
      if (list.length && index < 3) {
        for (let i = 0; i < list.length; i++) {
          list[i].childrens = formatToGraph(list[i].id, index + 1)
        }
      }
      return list
    }

    const mainList = formatToGraph()
    let list = []
    mainList.map((main) => {
      if (main.code_import) {
        main.childrens = (main.childrens || []).map((m) => {
          delete m.childrens
          return m
        })
        list = list.concat(main)
      } else {
        if (main.childrens) {
          main.childrens.map((subMain) => {
            if (subMain.childrens) {
              list = list.concat(subMain.childrens)
            }
          })
        }
      }
    })

    if (userPreview && userPreview.referentielIds && userPreview.referentielIds.length) {
      list = list.filter((r) => userPreview.referentielIds.indexOf(r.id) !== -1)
    }

    // force to order list
    list = orderBy(
      list.map((r) => {
        // si A-JUST CA
        if (Number(config.juridictionType) === 1) r.rank = referentielCAMappingIndex(r.label, r.rank)
        else r.rank = referentielMappingIndex(r.label, r.rank)

        return r
      }),
      ['rank'],
    )

    if (extractorMode) isJirs = true
    list = jirsRules(list, isJirs)
    list = filterReferentielsByVisibility(list, visibleIn)

    return list
  }

  /**
   * Importe une nouvelle liste de référentiel et modifie, supprime et crée en fonction du code d'import.
   *
   * Même contrat qu'avant, sans une requête par cellule :
   * - niveaux 2, 3 et 4 lus dans cet ordre ; le niveau 2 sert d'abord de parent ;
   * - création si le code est inconnu, sinon mise à jour du libellé, de la catégorie et de la visibilité ;
   * - un code déjà en base ne change pas de parent ;
   * - tout code absent du fichier est soft-delete, sauf les lignes sans code_import (un NOT IN SQL ignore les NULL) ;
   * - le rapport `persons` ne contient que les agents dont une activité pointe vers un contentieux créé ou modifié.
   *
   * Écarts volontaires, sans effet sur les données :
   * - en cas de code ou de libellé en double, on garde le plus petit id (findOne n'avait pas d'ORDER BY) ;
   * - une catégorie dont le niveau suivant est absent n'est plus réécrite : Sequelize ignorait déjà `undefined` ;
   * - un fichier sans aucun code ne supprime rien (un NOT IN vide ne filtrait pas non plus).
   *
   * @param {*} list
   * @returns
   */
  Model.importList = async (list) => {
    const rows = await Model.findAll({
      attributes: ['id', 'label', 'code_import', 'category', 'visible_in'],
      order: [['id', 'ASC']],
      raw: true,
      logging: false,
    })
    const byCode = new Map()
    const byLabel = new Map()
    for (const row of rows) {
      // Premier id seulement : équivalent stable de l'ancien findOne sans tri.
      if (row.code_import != null && !byCode.has(row.code_import)) byCode.set(row.code_import, row)
      if (!byLabel.has(row.label)) byLabel.set(row.label, row)
    }

    const knownCodes = new Set()
    const deltaToUpdate = []
    const pendingById = new Map()
    const categoryPrefix = isTj() ? '12.' : '14.'
    const minLevel = 3
    const nbLevel = 4

    const queueUpdate = (id, fields) => {
      const previous = pendingById.get(id)
      pendingById.set(id, previous ? { ...previous, ...fields } : { ...fields })
    }

    for (const ref of list) {
      let parentId = null

      // Niveau 2 (parent), puis 3, puis 4. Le parent des enfants est l'id résolu à ce niveau.
      for (let level = minLevel - 1; level <= nbLevel; level++) {
        const cell = ref[`niveau_${level}`]

        if (level === minLevel - 1) {
          // `undefined` ne matche pas. `null` matche un label NULL, comme findOne({ label: null }) → IS NULL.
          const group = cell === undefined ? undefined : byLabel.get(cell)
          if (group) parentId = group.id
        }

        if (!cell) continue

        const extract = extractCodeFromLabelImported(cell)
        // Sans code, la cellule reste un simple groupe parent : on ne crée ni ne met à jour.
        if (!extract || !extract.code) continue

        knownCodes.add(extract.code)
        let current = byCode.get(extract.code)

        if (!current) {
          const visibleIn = extract.extractorOnly ? [REFERENTIEL_VISIBILITY_EXTRACTOR] : undefined
          const created = await Model.create(
            {
              label: extract.label,
              code_import: extract.code,
              parent_id: parentId,
              category: extract.code.startsWith(categoryPrefix) && extract.code.length > 3 ? ref[`niveau_${level + 1}`] : null,
              ...(visibleIn ? { visible_in: visibleIn } : {}),
            },
            { logging: false },
          )

          current = {
            id: created.dataValues.id,
            label: created.dataValues.label,
            code_import: extract.code,
            category: created.dataValues.category ?? null,
            visible_in: created.dataValues.visible_in ?? visibleIn ?? ['everywhere'],
          }
          byCode.set(extract.code, current)
          // Visible tout de suite pour les lignes suivantes qui cherchent ce libellé comme parent.
          if (!byLabel.has(current.label)) byLabel.set(current.label, current)

          parentId = current.id
          deltaToUpdate.push({
            type: 'CREATE',
            id: current.id,
            label: extract.label,
            ...(visibleIn ? { visibleIn } : {}),
          })
          continue
        }

        // Le parent d'un code déjà connu n'est pas réécrit : l'ancien import ne le faisait pas non plus.
        if (extract.code.startsWith(categoryPrefix) && extract.code.length > 3) {
          const nextLevel = ref[`niveau_${level + 1}`]
          // Niveau absent → undefined. L'ancien update le passait tel quel et Sequelize l'ignorait.
          if (nextLevel !== undefined && current.category !== nextLevel) {
            deltaToUpdate.push({
              type: 'UPDATE',
              oldCategory: current.category,
              id: current.id,
              category: nextLevel || null,
            })
            queueUpdate(current.id, { category: nextLevel })
            current.category = nextLevel
          }
        }

        if (extract.label !== current.label) {
          deltaToUpdate.push({
            type: 'UPDATE',
            oldLabel: current.label,
            id: current.id,
            label: extract.label,
          })
          queueUpdate(current.id, { label: extract.label })
          // La ligne suivante peut utiliser ce nouveau libellé comme parent de niveau 2.
          if (byLabel.get(current.label) === current) byLabel.delete(current.label)
          current.label = extract.label
          if (!byLabel.has(current.label)) byLabel.set(current.label, current)
        }

        // On ne réduit la visibilité qu'à l'extracteur. L'absence du préfixe « 100. » ne la rouvre pas.
        if (extract.extractorOnly) {
          const currentVisibility = current.visible_in
          const alreadyExtractorOnly =
            Array.isArray(currentVisibility) && currentVisibility.length === 1 && currentVisibility[0] === REFERENTIEL_VISIBILITY_EXTRACTOR
          if (!alreadyExtractorOnly) {
            const visibleIn = [REFERENTIEL_VISIBILITY_EXTRACTOR]
            queueUpdate(current.id, { visible_in: visibleIn })
            current.visible_in = visibleIn
            deltaToUpdate.push({
              type: 'UPDATE',
              oldVisibleIn: currentVisibility ?? null,
              id: current.id,
              visibleIn,
            })
          }
        }

        parentId = current.id
      }
    }

    // Une seule écriture par ligne, avec la dernière valeur de chaque champ. Le delta, lui, garde chaque étape.
    await mapWithConcurrency([...pendingById.entries()], REFERENTIEL_DB_CONCURRENCY, ([id, fields]) =>
      Model.update(fields, { where: { id }, logging: false }),
    )

    // Pas de hook destroy sur ce modèle : un soft-delete groupé équivaut à l'ancienne boucle destroyById.
    // code_import NULL est conservé, comme avec NOT IN. Sans aucun code dans le fichier, on ne supprime rien.
    const listToRemove = knownCodes.size ? rows.filter((row) => row.code_import != null && !knownCodes.has(row.code_import)) : []
    if (listToRemove.length) {
      await Model.destroy({
        where: { id: { [Op.in]: listToRemove.map((row) => row.id) } },
        logging: false,
      })
      for (const removed of listToRemove) {
        deltaToUpdate.push({
          type: 'DELETE',
          label: removed.label,
          id: removed.id,
        })
      }
    }

    // Rapport d'abord, rangs ensuite : si le rapport échoue, les rangs restent ceux d'avant, comme dans l'ancien ordre.
    const humanList = await listHumansImpactedByReferentiel(Model, sequelizeInstance, deltaToUpdate)
    await Model.setRankToContentieux(list)

    return {
      persons: humanList,
      referentiel: deltaToUpdate,
    }
  }

  /**
   * Agents dont une activité pointe vers un contentieux créé ou modifié.
   *
   * L'ancien filtre gardait aussi les id supprimés, puis getAll les perdait : la jointure vers
   * ContentieuxReferentiels est obligatoire et le modèle est paranoid, donc un contentieux
   * soft-delete disparaît des activités. On ne charge donc pas ces agents. Un changement de
   * visibilité seul (`visibleIn` renseigné) était déjà exclu du rapport.
   *
   * @param {*} Model
   * @param {*} sequelizeInstance
   * @param {Array} deltaToUpdate
   */
  async function listHumansImpactedByReferentiel(ContentieuxModel, sequelize, deltaToUpdate) {
    const impactedIds = [
      ...new Set(
        deltaToUpdate
          .filter((delta) => delta.type !== 'DELETE' && (delta.type !== 'UPDATE' || delta.visibleIn === undefined))
          .map((delta) => delta.id),
      ),
    ]
    if (!impactedIds.length) return []

    const humanRows = await sequelize.query(
      `
        SELECT DISTINCT hr.id
        FROM "HRActivities" act
        INNER JOIN "HRSituations" sit ON sit.id = act.hr_situation_id AND sit.deleted_at IS NULL
        INNER JOIN "HumanResources" hr ON hr.id = sit.human_id AND hr.deleted_at IS NULL
        WHERE act.deleted_at IS NULL
          AND act.nac_id IN (:ids)
        ORDER BY hr.id
      `,
      {
        replacements: { ids: impactedIds },
        type: sequelize.QueryTypes.SELECT,
        logging: false,
      },
    )
    if (!humanRows.length) return []

    const humans = await ContentieuxModel.models.HumanResources.findAll({
      where: { id: { [Op.in]: humanRows.map((row) => row.id) } },
      order: [['id', 'ASC']],
      raw: true,
      logging: false,
    })
    const impactedIdSet = new Set(impactedIds)

    const persons = await mapWithConcurrency(humans, REFERENTIEL_DB_CONCURRENCY, async (person) => {
      const situations = await ContentieuxModel.models.HRSituations.getListByHumanId(person.id)
      const activities = situations.reduce((acc, situation) => {
        const filterActivities = (situation.activities || []).filter((activity) => impactedIdSet.has(activity.contentieux.id))
        return acc.concat(filterActivities)
      }, [])

      if (!activities.length) return null

      const contentieuxIds = activities.map((activity) => activity.contentieux.id)
      return {
        person,
        situations,
        activitiesImpacted: activities,
        impact: deltaToUpdate.filter((delta) => contentieuxIds.indexOf(delta.id) !== -1),
      }
    })

    return persons.filter(Boolean)
  }

  /**
   * Retourne le contentieux id en fonction de son nom
   * @param {*} label
   * @returns
   */
  Model.getContentieuxId = async (label) => {
    const listCont = await Model.findOne({
      attributes: ['id'],
      where: {
        label,
      },
      raw: true,
    })

    return listCont ? listCont.id : null
  }

  /**
   * Update contentieux rank.
   *
   * Pour chaque colonne niveau_1 à niveau_4, le compteur repart de 1 et n'avance que pour la
   * première occurrence d'un code (ou d'un libellé s'il n'y a pas de code) trouvée en base.
   * Il est incrémenté avant l'écriture : le premier contenu reçoit le rang 2. Un même id vu à
   * plusieurs niveaux garde le rang du dernier niveau. On n'écrit que si ce rang a changé.
   *
   * @param {*} list
   */
  Model.setRankToContentieux = async (list) => {
    const rows = await Model.findAll({
      attributes: ['id', 'label', 'code_import', 'rank'],
      order: [['id', 'ASC']],
      raw: true,
      logging: false,
    })
    const byCode = new Map()
    const byLabel = new Map()
    const rankById = new Map()
    for (const row of rows) {
      if (row.code_import != null && !byCode.has(row.code_import)) byCode.set(row.code_import, row)
      if (!byLabel.has(row.label)) byLabel.set(row.label, row)
      rankById.set(row.id, row.rank)
    }

    const nextRankById = new Map()
    for (let nodeLevel = 1; nodeLevel <= 4; nodeLevel++) {
      // Un seul ensemble pour les codes et les libellés, comme l'ancien tableau listUpdated.
      const seen = new Set()
      let rank = 1

      for (let i = 0; i < list.length; i++) {
        const extract = extractCodeFromLabelImported(list[i][`niveau_${nodeLevel}`])
        if (!extract) continue

        let cont = null
        if (extract.code) {
          if (!seen.has(extract.code)) {
            seen.add(extract.code)
            cont = byCode.get(extract.code) || null
          }
        } else if (!seen.has(extract.label)) {
          seen.add(extract.label)
          cont = byLabel.get(extract.label) || null
        }

        if (cont) {
          rank += 1
          nextRankById.set(cont.id, rank)
        }
      }
    }

    const assignments = []
    for (const [id, rank] of nextRankById) {
      const previous = rankById.get(id)
      if (previous != null && Number(previous) === rank) continue
      assignments.push({ id, rank })
    }

    await writeReferentielRanks(sequelizeInstance, assignments)
  }

  Model.updateRef = async (id, node, value) => {
    const ref = await Model.findOne({
      where: {
        id,
      },
    })

    if (ref) {
      if (node === 'visibleIn') {
        value = normalizeReferentielVisibility(value)
      }

      const oldValue = ref[camel_to_snake(node)]
      ref.set({ [camel_to_snake(node)]: value })
      await ref.save()

      if (node === 'onlyToHrBackup') {
        const hasChild = await Model.findOne({
          where: {
            parent_id: ref.dataValues.id,
          },
          raw: true,
        })
        if (!hasChild) {
          let hrBackupUpdated = []
          let allJuridictions = (await Model.models.HRBackups.getAll()).map((h) => h.id)
          if (Array.isArray(oldValue) && Array.isArray(value)) {
            hrBackupUpdated = [...oldValue.filter((e) => !value.includes(e)), ...value.filter((e) => !oldValue.includes(e))]
          } else if (oldValue === null && Array.isArray(value)) {
            hrBackupUpdated = allJuridictions.filter((e) => !value.includes(e))
          } else if (Array.isArray(oldValue) && value === null) {
            hrBackupUpdated = allJuridictions.filter((e) => !oldValue.includes(e))
          }
          //console.log('old value', oldValue)
          //console.log('new value', value)
          //console.log('delta juridictions', hrBackupUpdated)
          // synchronise by main contentieux

          // test 16s pour les ventilations
          await Model.models.HRActivities.syncAllVentilationByContentieux(ref.dataValues.parent_id)
          // test toutes les juridictions à 1,8min
          await Model.models.Activities.syncAllActivitiesByContentieux(ref.dataValues.parent_id, hrBackupUpdated)
          // reload all agents environ 40s / juridictions (180 environ)
          await Model.models.HumanResources.forceRecalculateAllHrCache()
        }
      }
    }
  }

  Model.getOneReferentiel = async (id) => {
    const ref = await Model.findOne({
      where: {
        id,
      },
    })
    return ref ? ref : null
  }

  /**
   * Indique si une juridiction est JIRS ou NON JIRS
   * @param {*} backupId
   * @returns
   */
  Model.isJirs = async (backupIds) => {
    if (!Array.isArray(backupIds)) {
      backupIds = [backupIds]
    }

    let isJirs = false
    const juridictions = await Model.models.HRBackups.findAll({
      where: {
        id: { [Op.in]: backupIds },
      },
      raw: true,
    })
    if (juridictions.length > 0) {
      isJirs = juridictions.some((j) => j.jirs)
    }

    return isJirs
  }

  /**
   * Retourne l'id d'un contentieux à partir de son label
   * @param {string} label - le label du contentieux
   * @returns {Promise<number|null>} - l'id du contentieux, ou null si non trouvé
   */
  Model.getContentieuxIdByLabel = async (label) => {
    if (!label) return null

    const contentieux = await Model.findOne({
      where: { label },
      attributes: ['id'],
      raw: true,
    })

    return contentieux ? contentieux.id : null
  }

  return Model
}
