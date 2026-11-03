import { endOfMonth, startOfMonth } from 'date-fns'
import { Op } from 'sequelize'
import { calculMainValuesFromChilds, compareGapBetweenData, preformatActivitiesArray } from '../utils/activities'
import { month, today } from '../utils/date'
import { maxBy } from 'lodash'
import { VALUE_QUALITY_OPTION, VALUE_QUALITY_TO_VERIFY } from '../constants/activities'
import { REFERENTIEL_VISIBILITY_ACTIVITY } from '../constants/referentiel'

/**
 * Scripts intermediaires entre la table d'activités (entrees, sorties, stock)
 */

export default (sequelizeInstance, Model) => {
  /**
   * Retourne la date du dernière stock pour une juridiction
   * @param {*} HRBackupId
   * @returns
   */
  Model.getLastMonth = async (HRBackupIds) => {
    if (!Array.isArray(HRBackupIds)) {
      HRBackupIds = [HRBackupIds]
    }

    const theLast = await Model.findOne({
      attributes: ['periode'],
      where: {
        hr_backup_id: HRBackupIds,
      },
      order: [['periode', 'desc']],
      raw: true,
    })

    if (theLast) {
      return theLast.periode
    }

    return null
  }

  /**
   * Retourne les activités des juridictions demandées.
   * Plusieurs hr_backup_id sont agrégés : une ligne par contentieux et par période,
   * avec la somme des entrées, sorties et stocks.
   * @param {*} HRBackupIds
   * @returns
   */
  Model.getAll = async (HRBackupIds, refIds = null) => {
    if (!Array.isArray(HRBackupIds)) {
      HRBackupIds = [HRBackupIds]
    }

    const whereCon = {}
    if (refIds) {
      whereCon.id = refIds
    }

    const activities = await Model.findAll({
      attributes: ['id', 'periode', 'entrees', 'sorties', 'stock', 'original_entrees', 'original_sorties', 'original_stock'],
      where: {
        hr_backup_id: HRBackupIds,
      },
      include: [
        {
          attributes: ['id', 'label', 'code_import'],
          model: Model.models.ContentieuxReferentiels,
          where: whereCon,
          required: true,
        },
      ],
      order: [['periode', 'asc']],
      raw: true,
      logging: false,
    })

    const add = (current, value) => {
      if (value === null || value === undefined) return current
      return (current || 0) + value
    }

    const byContentieuxAndPeriode = new Map()
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i]
      const contentieuxId = activity['ContentieuxReferentiel.id']
      const periode = month(activity.periode)
      const key = `${contentieuxId}-${periode.getTime()}`

      let row = byContentieuxAndPeriode.get(key)
      if (!row) {
        row = {
          id: activity.id,
          periode: activity.periode,
          entrees: null,
          sorties: null,
          stock: null,
          originalEntrees: null,
          originalSorties: null,
          originalStock: null,
          idReferentiel: contentieuxId,
          contentieux: {
            id: contentieuxId,
            label: activity['ContentieuxReferentiel.label'],
            code_import: activity['ContentieuxReferentiel.code_import'],
          },
        }
        byContentieuxAndPeriode.set(key, row)
      }

      row.entrees = add(row.entrees, activity.entrees !== null ? activity.entrees : activity.original_entrees)
      row.sorties = add(row.sorties, activity.sorties !== null ? activity.sorties : activity.original_sorties)
      row.stock = add(row.stock, activity.stock !== null ? activity.stock : activity.original_stock)
      row.originalEntrees = add(row.originalEntrees, activity.original_entrees)
      row.originalSorties = add(row.originalSorties, activity.original_sorties)
      row.originalStock = add(row.originalStock, activity.original_stock)
    }

    return [...byContentieuxAndPeriode.values()]
  }

  /**
   * Importe une liste d'activités à une juridiction. Et reformate et recalcul les stocks calculés.
   * @param {*} csv
   * @param {*} HRBackupId
   */
  Model.importList = async (csv, HRBackupId) => {
    const contentieuxIds = {}
    let minDate = null

    for (let i = 0; i < csv.length; i++) {
      const code = csv[i].code_import

      if (!contentieuxIds[code]) {
        const contentieux = await Model.models.ContentieuxReferentiels.findOne({
          attributes: ['id'],
          where: {
            code_import: code,
          },
          raw: true,
        })

        if (contentieux) {
          contentieuxIds[code] = contentieux.id
        }
      }

      if (contentieuxIds[code]) {
        const year = csv[i].periode.slice(0, 4)
        const month = +csv[i].periode.slice(-2) - 1
        const periode = new Date(year, month)

        if (minDate === null || periode.getTime() < minDate.getTime()) {
          minDate = new Date(periode)
        }

        const findExist = await Model.findOne({
          where: {
            hr_backup_id: HRBackupId,
            contentieux_id: contentieuxIds[code],
            periode: {
              [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
            },
          },
        })

        // clean null values
        csv[i].entrees = csv[i].entrees === 'null' || csv[i].entrees === '' ? null : csv[i].entrees
        csv[i].sorties = csv[i].sorties === 'null' || csv[i].sorties === '' ? null : csv[i].sorties
        csv[i].stock = csv[i].stock === 'null' || csv[i].stock === '' ? null : csv[i].stock

        // if existe update content
        if (
          findExist &&
          (csv[i].entrees !== findExist.dataValues.original_entrees ||
            csv[i].sorties !== findExist.dataValues.original_sorties ||
            csv[i].stock !== findExist.dataValues.original_stock)
        ) {
          await findExist.update({
            original_entrees: csv[i].entrees,
            original_sorties: csv[i].sorties,
            original_stock: csv[i].stock,
          })
        } else if (!findExist) {
          // else create
          await Model.create({
            hr_backup_id: HRBackupId,
            periode,
            contentieux_id: contentieuxIds[code],
            original_entrees: csv[i].entrees,
            original_sorties: csv[i].sorties,
            original_stock: csv[i].stock,
          })
        }
      }
    }

    await Model.cleanActivities(HRBackupId, minDate)
  }

  /**
   * Control et supprimé les activités qui sont en double pour un même mois et un même contentieux
   * @param {*} HRBackupId
   */
  Model.removeDuplicateDatas = async (HRBackupId, force = false) => {
    if (force) {
      // remove activities with deleted at is not null
      const activitiesToDeleted = await Model.findAll({
        where: {
          deleted_at: {
            [Op.ne]: null,
          },
        },
        paranoid: false,
      })
      //console.log('FORCE TO DELETE', activitiesToDeleted.length)
      for (let i = 0; i < activitiesToDeleted.length; i++) {
        await activitiesToDeleted[i].destroy({
          truncate: true,
          force: true,
        })
      }
    }

    // then
    const activities = await Model.findAll({
      attributes: ['periode', 'contentieux_id', 'hr_backup_id'],
      where: HRBackupId
        ? {
          hr_backup_id: HRBackupId,
        }
        : {},
      group: ['periode', 'contentieux_id', 'hr_backup_id'],
      raw: true,
    })

    for (let i = 0; i < activities.length; i++) {
      const periode = new Date(activities[i].periode)
      //console.log('try =>', i + '/' + activities.length)

      const duplicateActivities = await Model.findAll({
        where: {
          periode: {
            [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
          },
          hr_backup_id: activities[i].hr_backup_id,
          contentieux_id: activities[i].contentieux_id,
        },
        logging: false,
        order: ['updated_at', 'id'],
      })

      if (duplicateActivities.length >= 2) {
        //console.log('DUPPLICATE', duplicateActivities[0].dataValues)
        for (let z = 1; z < duplicateActivities.length; z++) {
          await duplicateActivities[z].destroy(
            force
              ? {
                truncate: true,
                force: true,
              }
              : {},
          )
        }
      }
    }
  }

  /**
   * Force pour recalculer les stocks à partir d'une date ou de la première donnée d'activité
   * @param {*} HRBackupId
   * @param {*} minPeriode
   * @returns
   */
  Model.cleanActivities = async (HRBackupId, minPeriode, force = false, filterReferentiels = null) => {
    let referentiels = await Model.models.ContentieuxReferentiels.getReferentiels(HRBackupId, null, false, filterReferentiels)

    //console.log('MIN PERIODE', HRBackupId, minPeriode)

    if (!minPeriode) {
      if (!force)
        return // stop we don't have values to analyse
      else {
        const minPeriodeFromDB = await Model.min('periode', {
          where: {
            hr_backup_id: HRBackupId,
          },
        })

        if (minPeriodeFromDB) {
          minPeriode = new Date(minPeriodeFromDB)
        }
      }
    }

    //console.log('START', referentiels, HRBackupId, minPeriode)

    // Même référentiel que updateTotalAndFuturValue : sans le filtre éventuel de cleanActivities.
    const fullReferentiels = filterReferentiels
      ? await Model.models.ContentieuxReferentiels.getReferentiels(HRBackupId, null, false, null, false, false)
      : referentiels
    const referentielById = new Map(fullReferentiels.map((item) => [item.id, item]))

    for (let i = 0; i < referentiels.length; i++) {
      await Model.updateTotalAndFuturValue(referentiels[i].id, minPeriode, HRBackupId, referentielById.get(referentiels[i].id))
    }
  }

  /**
   * Mes à jour d'une entrée, sortie, stock à un mois et un contentieux
   * @param {*} contentieuxId
   * @param {*} date
   * @param {*} values
   * @param {*} hrBackupId
   * @param {*} userId
   * @param {*} nodeUpdated
   */
  Model.updateBy = async (contentieuxId, date, values, hrBackupId, userId, nodeUpdated) => {
    date = new Date(date)

    //console.log(values)

    let original = null
    let verify = null
    let referentiel = null

    switch (nodeUpdated) {
      case 'entrees':
        original = 'original_entrees'
        verify = 'value_quality_in'
        break
      case 'sorties':
        original = 'original_sorties'
        verify = 'value_quality_out'
        break
      case 'stock':
        original = 'original_stock'
        verify = 'value_quality_stock'
        break
    }

    let findActivity = await Model.findOne({
      where: {
        periode: {
          [Op.between]: [startOfMonth(date), endOfMonth(date)],
        },
        hr_backup_id: hrBackupId,
        contentieux_id: contentieuxId,
      },
    })

    if (findActivity) {
      referentiel = await Model.models.ContentieuxReferentiels.getOneReferentiel(findActivity.dataValues.contentieux_id)
      //if(/*findActivity.dataValues[original] === values[nodeUpdated] && */(/*referentiel.dataValues[verify] !== VALUE_QUALITY_TO_VERIFY ||*/ /*(referentiel.dataValues[verify] === VALUE_QUALITY_TO_VERIFY && findActivity.dataValues[nodeUpdated] === values[nodeUpdated])) || */(values[nodeUpdated] === null && findActivity.dataValues[nodeUpdated] !== null)) {

      //En cas d'effacement d'une donnée ajusté.
      if (values[nodeUpdated] === null && findActivity.dataValues[nodeUpdated] !== null) {
        await findActivity.update({ [nodeUpdated]: null })
      } else {
        await findActivity.update({ [nodeUpdated]: values[nodeUpdated] })
      }
    } else {
      //console.log('create', {
      //  ...values,
      //  hr_backup_id: hrBackupId,
      //  contentieux_id: contentieuxId,
      //  periode: date,
      //})
      findActivity = await Model.create({
        ...values,
        hr_backup_id: hrBackupId,
        contentieux_id: contentieuxId,
        periode: date,
      })
    }

    if (userId !== null) {
      // Ne pas ajouter à l'historique des activité mis a jours, les données 'A_verifier' qui ont été confirmer
      if (
        referentiel /*&& findActivity.dataValues[original] === values[nodeUpdated]*/ /*&& ( referentiel[verify] !== VALUE_QUALITY_TO_VERIFY || (referentiel[verify] === VALUE_QUALITY_TO_VERIFY && findActivity.dataValues[nodeUpdated] === values[nodeUpdated])) ||*/ &&
        values[nodeUpdated] === null &&
        findActivity.dataValues[nodeUpdated] !== null
      )
        //console.log('ADD HISTORY', userId, findActivity.dataValues.id, nodeUpdated, null)
        await Model.models.HistoriesActivitiesUpdate.addHistory(userId, findActivity.dataValues.id, nodeUpdated, null)
      else await Model.models.HistoriesActivitiesUpdate.addHistory(userId, findActivity.dataValues.id, nodeUpdated, values[nodeUpdated])
    }

    const referentiels = await Model.models.ContentieuxReferentiels.getReferentiels(hrBackupId, null, false, null, false, false, userId)
    const ref = referentiels.find((r) => (r.childrens || []).find((c) => c.id === contentieuxId))

    if (ref) {
      await Model.updateTotalAndFuturValue(ref.id, date, hrBackupId)
    }
  }

  const PARENT_ACTIVITY_FIELDS = ['entrees', 'original_entrees', 'sorties', 'original_sorties', 'stock', 'original_stock']

  const timeOf = (periode) => new Date(periode).getTime()

  /**
   * Dernière ligne antérieure qui porte un stock ou un stock logiciel.
   * Même choix que checkAndUpdatePreviousStock.
   */
  const previousStockValueFrom = (row) => {
    if (!row) return null
    if (row.stock !== null) return { stock: row.stock, type: 'calculate' }
    if (row.original_stock !== null) return { stock: row.original_stock, type: 'setted' }
    return null
  }

  const latestEligibleBefore = (rows, monthStart, seed) => {
    let best = null
    let bestTime = -Infinity
    for (let i = 0; i < rows.length; i++) {
      const time = timeOf(rows[i].periode)
      if (time < monthStart && (rows[i].stock !== null || rows[i].original_stock !== null) && time >= bestTime) {
        best = rows[i]
        bestTime = time
      }
    }
    return best || seed || null
  }

  /**
   * Stock d'un contentieux enfant pour un mois.
   * Si il y a un stock sur le mois précédent:
   * donnée calculée -> stock N = stock N-1 ajusté + entrées N ajustées - sorties N ajustées
   * sinon -> stock N = stock N logiciel + (entrées N ajustées - entrées N logiciel) - (sorties N ajustées - sorties N logiciel)
   */
  const computeChildStock = (activity, previousStockValue, valueQualityStock) => {
    let currentStock = activity.stock

    if (previousStockValue !== null) {
      if (activity.entrees !== null || activity.sorties !== null || previousStockValue.type === 'calculate') {
        const entrees = preformatActivitiesArray([activity], ['entrees', 'original_entrees'])
        const sorties = preformatActivitiesArray([activity], ['sorties', 'original_sorties'])

        if (previousStockValue.type === 'calculate') {
          const stock = previousStockValue.stock ?? 0
          currentStock = (stock ?? 0) + (entrees ?? 0) - (sorties ?? 0)
        } else {
          const stock = preformatActivitiesArray([activity], ['original_stock'])
          currentStock = (stock ?? 0) + (entrees - (activity.original_entrees ?? 0)) - (sorties - (activity.original_sorties ?? 0))
        }
      } else {
        currentStock = activity.original_stock
      }
    } else if (activity.original_stock !== null) {
      currentStock = activity.original_stock

      if (activity.entrees !== null) {
        currentStock += activity.entrees || 0
      } else if (activity.original_entrees !== null && activity.sorties !== null) {
        currentStock += activity.original_entrees || 0
      }

      if (activity.sorties !== null) {
        currentStock -= activity.sorties || 0
      } else if (activity.original_sorties !== null && activity.entrees !== null) {
        currentStock -= activity.original_sorties || 0
      }
    }

    if (currentStock === activity.original_stock) {
      const hasMovements = activity.entrees !== null || activity.sorties !== null
      if (valueQualityStock === VALUE_QUALITY_TO_VERIFY && hasMovements) {
        // Stock à vérifier avec des mouvements : on garde le stock calculé.
      } else if (!previousStockValue || previousStockValue.type !== 'calculate') {
        currentStock = null
      }
    }

    if (currentStock !== null && currentStock < 0) currentStock = 0

    return currentStock
  }

  const applyActivityUpdates = async (rows, columns, transaction) => {
    const chunkSize = 400
    for (let offset = 0; offset < rows.length; offset += chunkSize) {
      const chunk = rows.slice(offset, offset + chunkSize)
      const replacements = {}
      const values = chunk.map((row, index) => {
        const casts = columns.map((column) => {
          const key = `${column}_${index}`
          replacements[key] = row[column]
          return `CAST(:${key} AS INTEGER)`
        })
        return `(${casts.join(', ')})`
      })
      const setClause = columns
        .filter((column) => column !== 'id')
        .map((column) => `${column} = data.${column}`)
        .join(', ')

      await Model.sequelize.query(
        `
          UPDATE "Activities" AS activity
          SET ${setClause}, updated_at = NOW()
          FROM (VALUES ${values.join(', ')}) AS data(${columns.join(', ')})
          WHERE activity.id = data.id AND activity.deleted_at IS NULL
        `,
        { replacements, transaction },
      )
    }
  }

  /**
   * Calcul les nouveaux entrées, sorties niveau 3 et les stocks de niveau 3 et 4.
   * La plage de mois est lue une fois, le stock est calculé en mémoire, puis écrit en lot.
   * @param {*} mainContentieuxId
   * @param {*} date
   * @param {*} hrBackupId
   * @param {*} referentiel référentiel déjà chargé avec ses enfants. Sinon il est relu.
   */
  Model.updateTotalAndFuturValue = async (mainContentieuxId, date, hrBackupId, referentiel = null) => {
    date = new Date(date) // detach date reference
    let ref = referentiel && referentiel.id === mainContentieuxId ? referentiel : null
    if (!ref) {
      const referentiels = await Model.models.ContentieuxReferentiels.getReferentiels(hrBackupId, null, false, null, false, false)
      ref = referentiels.find((item) => item.id === mainContentieuxId)
    }
    if (!ref) return

    const childrens = ref.childrens || []
    const childIds = childrens.map((child) => child.id)
    const qualityById = new Map(childrens.map((child) => [child.id, child.valueQualityStock ?? child.value_quality_stock ?? null]))
    const contentieuxIds = [ref.id, ...childIds.filter((id) => id !== ref.id)]

    await Model.sequelize.transaction(async (transaction) => {
      const lastActivity = await Model.findOne({
        attributes: ['periode'],
        where: { hr_backup_id: hrBackupId },
        order: [['periode', 'DESC']],
        raw: true,
        transaction,
      })
      const lastPeriode = lastActivity ? new Date(lastActivity.periode) : null

      // Même avancement que l'ancienne boucle : +1 mois, y compris le saut du 31 janvier vers mars.
      const cursor = new Date(date)
      const months = []
      do {
        months.push(new Date(cursor.getTime()))
        if (!lastPeriode || lastPeriode <= endOfMonth(cursor)) break
        cursor.setMonth(cursor.getMonth() + 1)
      } while (true)

      const loaded = await Model.findAll({
        attributes: ['id', 'periode', 'contentieux_id', ...PARENT_ACTIVITY_FIELDS],
        where: {
          periode: {
            [Op.between]: [startOfMonth(months[0]), endOfMonth(months[months.length - 1])],
          },
          hr_backup_id: hrBackupId,
          contentieux_id: contentieuxIds,
        },
        raw: true,
        transaction,
      })

      const rowsByContentieux = new Map()
      for (let i = 0; i < loaded.length; i++) {
        const row = loaded[i]
        const bucket = rowsByContentieux.get(row.contentieux_id)
        if (bucket) bucket.push(row)
        else rowsByContentieux.set(row.contentieux_id, [row])
      }

      let previousByContentieux = new Map()
      if (childIds.length) {
        const previousRows = await Model.sequelize.query(
          `
            SELECT DISTINCT ON (contentieux_id) contentieux_id, periode, stock, original_stock
            FROM "Activities"
            WHERE hr_backup_id = :hrBackupId
              AND contentieux_id IN (:childIds)
              AND periode < :monthStart
              AND deleted_at IS NULL
              AND (stock IS NOT NULL OR original_stock IS NOT NULL)
            ORDER BY contentieux_id, periode DESC
          `,
          {
            replacements: {
              hrBackupId,
              childIds,
              monthStart: startOfMonth(months[0]),
            },
            type: Model.sequelize.QueryTypes.SELECT,
            transaction,
          },
        )
        previousByContentieux = new Map(previousRows.map((row) => [Number(row.contentieux_id), row]))
      }

      const toCreate = []
      const stockUpdates = []
      const parentUpdates = []

      for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
        const monthDate = months[monthIndex]
        const monthStart = startOfMonth(monthDate).getTime()
        const monthEnd = endOfMonth(monthDate).getTime()
        const monthChildren = []

        for (let childIndex = 0; childIndex < childrens.length; childIndex++) {
          const child = childrens[childIndex]
          const rows = rowsByContentieux.get(child.id) || []
          if (!rowsByContentieux.has(child.id)) rowsByContentieux.set(child.id, rows)

          let monthRows = []
          for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const time = timeOf(rows[rowIndex].periode)
            if (time >= monthStart && time <= monthEnd) monthRows.push(rows[rowIndex])
          }

          if (!monthRows.length) {
            const created = {
              periode: new Date(monthDate.getTime()),
              hr_backup_id: hrBackupId,
              contentieux_id: child.id,
              entrees: null,
              sorties: null,
              stock: null,
              original_entrees: null,
              original_sorties: null,
              original_stock: null,
            }
            rows.push(created)
            monthRows = [created]
          }

          const previousStockValue = previousStockValueFrom(
            latestEligibleBefore(rows, monthStart, previousByContentieux.get(Number(child.id))),
          )
          const quality = qualityById.get(child.id) ?? null

          for (let rowIndex = 0; rowIndex < monthRows.length; rowIndex++) {
            const row = monthRows[rowIndex]
            const currentStock = computeChildStock(row, previousStockValue, quality)
            if (row.id) {
              if (row.stock !== currentStock) stockUpdates.push({ id: row.id, stock: currentStock })
            }
            row.stock = currentStock
            monthChildren.push(row)
          }
        }

        const totals = calculMainValuesFromChilds(monthChildren, childrens)
        const parentRows = rowsByContentieux.get(ref.id) || []
        let parent = null
        for (let rowIndex = 0; rowIndex < parentRows.length; rowIndex++) {
          const time = timeOf(parentRows[rowIndex].periode)
          if (time < monthStart || time > monthEnd || !parentRows[rowIndex].id) continue
          if (!parent || parentRows[rowIndex].id < parent.id) parent = parentRows[rowIndex]
        }

        if (parent) {
          const changed = PARENT_ACTIVITY_FIELDS.some((field) => parent[field] !== totals[field])
          if (changed) parentUpdates.push({ id: parent.id, ...totals })
        } else {
          toCreate.push({
            periode: new Date(monthDate.getTime()),
            hr_backup_id: hrBackupId,
            contentieux_id: ref.id,
            ...totals,
          })
        }
      }

      for (let i = 0; i < childrens.length; i++) {
        const rows = rowsByContentieux.get(childrens[i].id) || []
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          if (!rows[rowIndex].id) toCreate.push(rows[rowIndex])
        }
      }

      if (toCreate.length) await Model.bulkCreate(toCreate, { transaction })
      await applyActivityUpdates(stockUpdates, ['id', 'stock'], transaction)
      await applyActivityUpdates(parentUpdates, ['id', ...PARENT_ACTIVITY_FIELDS], transaction)
    })
  }

  /**
   * check if they are a stock before, set by user, and find it. If this is multiple month ago then update all month between them.
   * @param {*} contentieuxId
   * @param {*} periode
   * @param {*} backupId
   * @returns
   */
  Model.checkAndUpdatePreviousStock = async (contentieuxId, periode, backupId) => {
    const startOfMonthPeriode = startOfMonth(periode)

    const previousPeriode = await Model.findAll({
      attributes: ['periode', 'stock', 'original_stock'],
      where: {
        periode: {
          [Op.lt]: startOfMonthPeriode,
        },
        [Op.or]: [
          {
            stock: {
              [Op.ne]: null,
            },
          },
          {
            original_stock: {
              [Op.ne]: null,
            },
          },
        ],
        hr_backup_id: backupId,
        contentieux_id: contentieuxId,
      },
      raw: true,
      order: ['periode'],
    })

    if (previousPeriode.length) {
      if (previousPeriode[previousPeriode.length - 1].stock !== null) {
        return {
          stock: previousPeriode[previousPeriode.length - 1].stock,
          type: 'calculate',
        }
      } else if (previousPeriode[previousPeriode.length - 1].original_stock === null) {
        return null
      } else if (previousPeriode[previousPeriode.length - 1].original_stock !== null) {
        return {
          stock: previousPeriode[previousPeriode.length - 1].original_stock,
          type: 'setted',
        }
      }
    }
    return null
  }

  Model.getByMonthNew = async (date, HrBackupIds, contentieuxId = null, details = true) => {
    if (!Array.isArray(HrBackupIds)) {
      HrBackupIds = [HrBackupIds]
    }

    date = today(date)

    const whereList = contentieuxId ? { contentieux_id: contentieuxId } : {}

    const rawActivities = await Model.findAll({
      attributes: [
        'id',
        'periode',
        'entrees',
        'sorties',
        'stock',
        ['original_entrees', 'originalEntrees'],
        ['original_sorties', 'originalSorties'],
        ['original_stock', 'originalStock'],
      ],
      where: {
        hr_backup_id: HrBackupIds,
        periode: {
          [Op.between]: [startOfMonth(date), endOfMonth(date)],
        },
        ...whereList,
      },
      include: [
        {
          model: Model.models.ContentieuxReferentiels,
          attributes: ['id', 'label'],
        },
      ],
      raw: true,
    })

    const contentieuxIds = [...new Set(rawActivities.map((a) => a['ContentieuxReferentiel.id']))]
    const commentsMap = await Model.models.Comments.getNbByActivityTypes(contentieuxIds, HrBackupIds)
    const allLastActivitesByTypes = (await Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(rawActivities.map((a) => a.id), ['entrees', 'sorties', 'stock'])) || []

    // ⏬ Construction finale avec mêmes valeurs que l’ancienne méthode
    return await Promise.all(
      rawActivities.map(async (row) => {
        const contentieuxId = row['ContentieuxReferentiel.id']
        const activityId = row.id

        let updatedBy = null

        if (details) {
          const entrees = allLastActivitesByTypes.find((e) => e.activityId === activityId && e.nodeUpdated === 'entrees')
          const sorties = allLastActivitesByTypes.find((e) => e.activityId === activityId && e.nodeUpdated === 'sorties')
          const stock = allLastActivitesByTypes.find((e) => e.activityId === activityId && e.nodeUpdated === 'stock')

          updatedBy = { entrees, sorties, stock }
        }

        return {
          id: activityId,
          periode: row.periode,
          entrees: row.entrees,
          originalEntrees: row.originalEntrees,
          sorties: row.sorties,
          originalSorties: row.originalSorties,
          stock: row.stock,
          originalStock: row.originalStock,
          contentieux: {
            id: contentieuxId,
            label: row['ContentieuxReferentiel.label'],
          },
          nbComments: commentsMap.get(contentieuxId) || 0,
          updatedBy,
        }
      }),
    )
  }

  /**
   * List des activités d'un mois et d'une juridiction
   * @param {*} date
   * @param {*} HrBackupId
   * @returns
   */
  Model.getByMonth = async (date, HrBackupId, contentieuxId = null, details = true) => {
    const whereList = {}
    date = today(date)

    if (contentieuxId) {
      whereList.contentieux_id = contentieuxId
    }

    const list = await Model.findAll({
      attributes: [
        'id',
        'periode',
        'entrees',
        'sorties',
        'stock',
        ['original_entrees', 'originalEntrees'],
        ['original_sorties', 'originalSorties'],
        ['original_stock', 'originalStock'],
      ],
      where: {
        hr_backup_id: HrBackupId,
        periode: {
          [Op.between]: [startOfMonth(date), endOfMonth(date)],
        },
        ...whereList,
      },
      include: [
        {
          model: Model.models.ContentieuxReferentiels,
        },
      ],
      raw: true,
    })

    const allLastActivitesByTypes = (await Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(list.map((a) => a.id), ['entrees', 'sorties', 'stock'])) || []

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        periode: list[i].periode,
        entrees: list[i].entrees,
        originalEntrees: list[i].originalEntrees,
        sorties: list[i].sorties,
        originalSorties: list[i].originalSorties,
        stock: list[i].stock,
        originalStock: list[i].originalStock,
        contentieux: {
          id: list[i]['ContentieuxReferentiel.id'],
          label: list[i]['ContentieuxReferentiel.label'],
        },
        nbComments: await Model.models.Comments.getNbConId(list[i]['ContentieuxReferentiel.id'], HrBackupId),
        updatedBy: details
          ? {
            entrees: allLastActivitesByTypes.find((e) => e.activityId === list[i].id && e.nodeUpdated === 'entrees'),
            sorties: allLastActivitesByTypes.find((e) => e.activityId === list[i].id && e.nodeUpdated === 'sorties'),
            stock: allLastActivitesByTypes.find((e) => e.activityId === list[i].id && e.nodeUpdated === 'stock'),
          }
          : null,
      }
    }
    return list
  }

  /**
   * Importe une liste d'activités à une liste de juridiction. Et reformate et recalcul les stocks calculés.
   * @param {*} csv
   */
  Model.importMultipleJuridictions = async (csv) => {
    const contentieuxIds = {}
    const listBackupId = []
    let minDate = {}
    const tmpJuridictions = {}

    console.time('step2')
    for (let i = 0; i < csv.length; i++) {
      const code = csv[i].code_import
      let HRBackupId = tmpJuridictions[csv[i].juridiction]

      if (!HRBackupId) {
        HRBackupId = await Model.models.HRBackups.findOrCreateLabel(csv[i].juridiction)
        tmpJuridictions[csv[i].juridiction] = HRBackupId
      }

      if (HRBackupId === null) {
        continue
      }

      // save id to clean base after import
      if (!listBackupId.includes(HRBackupId)) {
        listBackupId.push(HRBackupId)
      }

      if (!contentieuxIds[code]) {
        const contentieux = await Model.models.ContentieuxReferentiels.findOne({
          attributes: ['id'],
          where: {
            code_import: code,
          },
          raw: true,
          logging: false,
        })

        if (contentieux) {
          contentieuxIds[code] = contentieux.id
        }
      }

      if (contentieuxIds[code]) {
        const year = csv[i].periode.slice(0, 4)
        const month = +csv[i].periode.slice(-2) - 1
        const periode = new Date(year, month)

        const findExist = await Model.findOne({
          attributes: ['id', 'entrees', 'original_entrees', 'sorties', 'original_sorties', 'stock', 'original_stock'],
          where: {
            hr_backup_id: HRBackupId,
            contentieux_id: contentieuxIds[code],
            periode: {
              [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
            },
          },
          raw: true,
          logging: false,
        })

        // clean null values
        csv[i].entrees = csv[i].entrees === 'null' || csv[i].entrees === '' ? null : +csv[i].entrees
        csv[i].sorties = csv[i].sorties === 'null' || csv[i].sorties === '' ? null : +csv[i].sorties
        csv[i].stock = csv[i].stock === 'null' || csv[i].stock === '' ? null : +csv[i].stock

        // if existe update content
        if (
          findExist &&
          (csv[i].entrees !== findExist.original_entrees || csv[i].sorties !== findExist.original_sorties || csv[i].stock !== findExist.original_stock)
        ) {
          // save min date
          if (!minDate[HRBackupId] || startOfMonth(periode).getTime() < minDate[HRBackupId].getTime()) {
            minDate[HRBackupId] = new Date(startOfMonth(periode))
          }

          await Model.updateById(findExist.id, {
            original_entrees: csv[i].entrees,
            original_sorties: csv[i].sorties,
            original_stock: csv[i].stock,
          })
        } else if (!findExist) {
          // save min date
          if (!minDate[HRBackupId] || startOfMonth(periode).getTime() < minDate[HRBackupId].getTime()) {
            minDate[HRBackupId] = new Date(startOfMonth(periode))
          }

          // else create
          await Model.create({
            hr_backup_id: HRBackupId,
            periode,
            contentieux_id: contentieuxIds[code],
            original_entrees: csv[i].entrees,
            original_sorties: csv[i].sorties,
            original_stock: csv[i].stock,
          })
        }
      }
    }
    console.timeEnd('step2')

    for (let i = 0; i < listBackupId.length; i++) {
      console.time('step3')
      await Model.cleanActivities(listBackupId[i], minDate[listBackupId[i]])

      console.timeEnd('step3')
    }
  }

  /**
   * List des activités non complétés d'une tranche
   * @param {*} HrBackupId
   * @param {*} dateStart
   * @param {*} dateEnd
   * @returns
   */
  Model.getNotCompleteActivities = async (HrBackupIds, dateStart, dateEnd, userId) => {
    if (!Array.isArray(HrBackupIds)) {
      HrBackupIds = [HrBackupIds]
    }

    dateStart = new Date(dateStart)
    dateEnd = new Date(dateEnd)

    let allContentieux =
      (await Model.models.ContentieuxReferentiels.getReferentiels(HrBackupIds, REFERENTIEL_VISIBILITY_ACTIVITY, false, null, false, false, userId)) || []
    let list = (
      (await Model.models.ContentieuxReferentiels.getReferentiels(HrBackupIds, REFERENTIEL_VISIBILITY_ACTIVITY, false, null, false, false, userId)) || []
    )
      .filter((r) => r.label !== 'Indisponibilité' && r.label !== 'Autres activités')
      .map((c) => {
        const childrens = (c.childrens || [])
          .filter(
            (r) => !(r.valueQualityIn === VALUE_QUALITY_OPTION && r.valueQualityOut === VALUE_QUALITY_OPTION && r.valueQualityStock === VALUE_QUALITY_OPTION),
          )
          .map((ch) => ({ ...ch, lastDateWhithoutData: null }))
        allContentieux = [...allContentieux, ...(c.childrens || [])]
        return { ...c, childrens }
      })

    let contentieuxToFind = []
    do {
      const date = month(dateEnd)
      contentieuxToFind = []
      list.map((c) => {
        const childrensToSearch = (c.childrens || []).filter((ch) => ch.lastDateWhithoutData === null)
        if (childrensToSearch.length) {
          contentieuxToFind.push(c.id)
          contentieuxToFind = contentieuxToFind.concat(childrensToSearch.map((ch) => ch.id))
        }
      })

      const monthActivitiesContentieuxIds = ((await Model.getByMonthNew(date, HrBackupIds, contentieuxToFind)) || [])
        .filter(
          (a) =>
            (a.entrees !== null || a.originalEntrees !== null) &&
            (a.sorties !== null || a.originalSorties !== null) &&
            (a.stock !== null || a.originalStock !== null),
        )
        .filter((a) => {
          const curCont = allContentieux.find((c) => a.contentieux.id === c.id)

          if (!curCont) {
            return (
              (a.entrees !== null || a.originalEntrees !== null) &&
              (a.sorties !== null || a.originalSorties !== null) &&
              (a.stock !== null || a.originalStock !== null)
            )
          }

          return (
            (a.entrees !== null || a.originalEntrees !== null || curCont.valueQualityIn === VALUE_QUALITY_OPTION) &&
            (a.sorties !== null || a.originalSorties !== null || curCont.valueQualityOut === VALUE_QUALITY_OPTION) &&
            (a.stock !== null || a.originalStock !== null || curCont.valueQualityStock === VALUE_QUALITY_OPTION)
          )
        })
        .map((f) => f.contentieux.id)

      list = list.map((c) => {
        let childrens = c.childrens || []
        childrens = childrens.map((ch) => {
          if (ch.lastDateWhithoutData === null && !monthActivitiesContentieuxIds.includes(ch.id)) {
            ch.lastDateWhithoutData = new Date(date)
          }

          return {
            ...ch,
          }
        })

        return {
          ...c,
          childrens,
        }
      })

      dateEnd.setMonth(dateEnd.getMonth() - 1)
    } while (dateStart.getTime() < dateEnd.getTime() && contentieuxToFind.length)

    return list
      .map((c) => {
        const childrens = (c.childrens || []).filter((ch) => ch.lastDateWhithoutData)
        const max = maxBy(childrens, 'lastDateWhithoutData')

        return {
          ...c,
          lastDateWhithoutData: max?.lastDateWhithoutData,
          childrens,
        }
      })
      .filter((c) => {
        const childrens = c.childrens || []

        return !childrens.every((c) => c.lastDateWhithoutData === null)
      })
  }

  /**
   * Obtenir un contentieux pour un mois donnée
   * @param {*} HRBackupId
   * @param {*} contentieuxId
   * @param {*} date
   * @returns
   */
  Model.getOneByMonth = async (HRBackupId, contentieuxId, date) => {
    //console.log('GetOneByMonth')
    const year = new Date(date).getFullYear().toString()
    const month = (new Date(date).getMonth() + 1).toString()
    const periode = year + '-' + month
    return await Model.findOne({
      attributes: ['periode', 'entrees', 'sorties', 'stock', 'original_entrees', 'original_sorties', 'original_stock'],
      where: {
        hr_backup_id: HRBackupId,
        contentieux_id: contentieuxId,
        periode: {
          [Op.gte]: new Date(year, month - 1, 1), // Date de début du month
          [Op.lt]: new Date(year, month, 1),
        },
      },
    })
  }

  /**
   * Vérifie les nouvelles données prêtes à être importés pour toutes les juridictions
   * @param {*} csv
   */
  Model.checkDataBeforeImportAll = async (csv) => {
    const contentieuxIds = {}
    const to_create = []
    const to_update = []
    const to_warn = []
    const tmpJuridictions = {}
    const types = { in: 'entrees', out: 'sorties', stock: 'stocks' }

    console.time('step2')

    for (let i = 0; i < csv.length; i++) {
      const code = csv[i].code_import
      let HRBackupId = tmpJuridictions[csv[i].juridiction]
      if (!HRBackupId) {
        HRBackupId = await Model.models.HRBackups.findByLabel(csv[i].juridiction)
        tmpJuridictions[csv[i].juridiction] = HRBackupId
      }
      if (HRBackupId === null) {
        continue
      }

      if (!contentieuxIds[code]) {
        const contentieux = await Model.models.ContentieuxReferentiels.findOne({
          attributes: ['id'],
          where: {
            code_import: code,
          },
          raw: true,
          logging: false,
        })

        if (contentieux) {
          contentieuxIds[code] = contentieux.id
        }
      }

      if (contentieuxIds[code]) {
        const year = csv[i].periode.slice(0, 4)
        const month = +csv[i].periode.slice(-2) - 1
        const periode = new Date(year, month)

        const findExist = await Model.findOne({
          attributes: ['id', 'entrees', 'original_entrees', 'sorties', 'original_sorties', 'stock', 'original_stock'],
          where: {
            hr_backup_id: HRBackupId,
            contentieux_id: contentieuxIds[code],
            periode: {
              [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
            },
          },
          raw: true,
          logging: false,
        })

        // clean null values
        csv[i].entrees = csv[i].entrees === 'null' || csv[i].entrees === '' ? null : +csv[i].entrees
        csv[i].sorties = csv[i].sorties === 'null' || csv[i].sorties === '' ? null : +csv[i].sorties
        csv[i].stock = csv[i].stock === 'null' || csv[i].stock === '' ? null : +csv[i].stock

        // if existe add to to_update array
        if (
          findExist &&
          (csv[i].entrees !== findExist.original_entrees || csv[i].sorties !== findExist.original_sorties || csv[i].stock !== findExist.original_stock)
        ) {
          to_update.push({
            data_id: findExist.id,
            original_entrees: csv[i].entrees,
            original_sorties: csv[i].sorties,
            original_stock: csv[i].stock,
          })
        } else if (!findExist) {
          // else add to to_create array
          to_create.push({
            hr_backup_id: HRBackupId,
            periode: csv[i].periode,
            contentieux_id: contentieuxIds[code],
            original_entrees: csv[i].entrees,
            original_sorties: csv[i].sorties,
            original_stock: csv[i].stock,
          })
        }
      }
    }

    // Catch all value in to_create array and compare them to last values in DB
    for (let i = 0; i < to_create.length; i++) {
      const year = to_create[i].periode.slice(0, 4)
      const month = +(to_create[i].periode.slice(-2) - 1 - 1)
      const periode = new Date(year, month)

      await Model.findOne({
        attributes: ['id', 'entrees', 'original_entrees', 'sorties', 'original_sorties', 'stock', 'original_stock'],
        where: {
          hr_backup_id: to_create[i].hr_backup_id,
          contentieux_id: to_create[i].contentieux_id,
          periode: {
            [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
          },
        },
        raw: true,
        logging: false,
      }).then(async (result) => {
        const percentageThreshold = 10 //25
        const absoluteThreshold = 100 //50
        const newData = {
          in: to_create[i].original_entrees,
          out: to_create[i].original_sorties,
          stock: to_create[i].original_stock,
        }
        const lastData = {
          in: result ? result.original_entrees : null,
          out: result ? result.original_sorties : null,
          stock: result ? result.original_stock : null,
        }
        for (let type in types) {
          const gap = compareGapBetweenData(newData[type], lastData[type], percentageThreshold, absoluteThreshold)
          if (gap) {
            to_warn.push({
              ...gap,
              hr_backup_label: await Model.models.HRBackups.findById(to_create[i].hr_backup_id).then((res) => {
                return res.label
              }),
              contentieux_label: await Model.models.ContentieuxReferentiels.getOneReferentiel(to_create[i].contentieux_id).then((res) => {
                return res.label
              }),
              type: types[type],
              lastPeriode: periode,
              newPeriode: new Date(year, to_create[i].periode.slice(-2) - 1),
            })
          }
        }
      })
    }
    console.timeEnd('step2')
    return { to_warn }
  }

  /**
   * Vérifie les nouvelles données prêtes à être importés pour une seule juridiction
   * @param {*} csv
   * @param {*} HRBackupId
   */
  Model.checkDataBeforeImportOne = async (csv, HRBackupId) => {
    const contentieuxIds = {}
    const to_create = []
    const to_update = []
    const to_warn = []
    const tmpJuridictions = {}
    const types = { in: 'entrees', out: 'sorties', stock: 'stocks' }

    console.time('step2')

    for (let i = 0; i < csv.length; i++) {
      const code = csv[i].code_import

      if (!contentieuxIds[code]) {
        const contentieux = await Model.models.ContentieuxReferentiels.findOne({
          attributes: ['id'],
          where: {
            code_import: code,
          },
          raw: true,
        })

        if (contentieux) {
          contentieuxIds[code] = contentieux.id
        }
      }

      if (contentieuxIds[code]) {
        const year = csv[i].periode.slice(0, 4)
        const month = +csv[i].periode.slice(-2) - 1
        const periode = new Date(year, month)

        const findExist = await Model.findOne({
          attributes: ['id', 'entrees', 'original_entrees', 'sorties', 'original_sorties', 'stock', 'original_stock'],
          where: {
            hr_backup_id: HRBackupId,
            contentieux_id: contentieuxIds[code],
            periode: {
              [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
            },
          },
          raw: true,
          logging: false,
        })

        // clean null values
        csv[i].entrees = csv[i].entrees === 'null' || csv[i].entrees === '' ? null : +csv[i].entrees
        csv[i].sorties = csv[i].sorties === 'null' || csv[i].sorties === '' ? null : +csv[i].sorties
        csv[i].stock = csv[i].stock === 'null' || csv[i].stock === '' ? null : +csv[i].stock

        // if existe add to to_update array
        if (
          findExist &&
          (csv[i].entrees !== findExist.original_entrees || csv[i].sorties !== findExist.original_sorties || csv[i].stock !== findExist.original_stock)
        ) {
          to_update.push({
            data_id: findExist.id,
            original_entrees: csv[i].entrees,
            original_sorties: csv[i].sorties,
            original_stock: csv[i].stock,
          })
        } else if (!findExist) {
          // else add to to_create array
          to_create.push({
            hr_backup_id: HRBackupId,
            periode: csv[i].periode,
            contentieux_id: contentieuxIds[code],
            original_entrees: csv[i].entrees,
            original_sorties: csv[i].sorties,
            original_stock: csv[i].stock,
          })
        }
      }
    }

    // Catch all value in to_create array and compare them to last values in DB
    for (let i = 0; i < to_create.length; i++) {
      const year = to_create[i].periode.slice(0, 4)
      const month = +(to_create[i].periode.slice(-2) - 1 - 1)
      const periode = new Date(year, month)

      await Model.findOne({
        attributes: ['id', 'entrees', 'original_entrees', 'sorties', 'original_sorties', 'stock', 'original_stock'],
        where: {
          hr_backup_id: to_create[i].hr_backup_id,
          contentieux_id: to_create[i].contentieux_id,
          periode: {
            [Op.between]: [startOfMonth(periode), endOfMonth(periode)],
          },
        },
        raw: true,
        logging: false,
      }).then(async (result) => {
        const percentageThreshold = 10 //25
        const absoluteThreshold = 100 //50
        const newData = {
          in: to_create[i].original_entrees,
          out: to_create[i].original_sorties,
          stock: to_create[i].original_stock,
        }
        const lastData = {
          in: result ? result.original_entrees : null,
          out: result ? result.original_sorties : null,
          stock: result ? result.original_stock : null,
        }
        for (let type in types) {
          const gap = compareGapBetweenData(newData[type], lastData[type], percentageThreshold, absoluteThreshold)
          if (gap) {
            to_warn.push({
              ...gap,
              hr_backup_label: await Model.models.HRBackups.findById(to_create[i].hr_backup_id).then((res) => {
                return res.label
              }),
              contentieux_label: await Model.models.ContentieuxReferentiels.getOneReferentiel(to_create[i].contentieux_id).then((res) => {
                return res.label
              }),
              type: types[type],
              lastPeriode: periode,
              newPeriode: new Date(year, to_create[i].periode.slice(-2) - 1),
            })
          }
        }
      })
    }
    console.timeEnd('step2')
    return { to_warn }
  }

  /**
   * Réapplique « Compter » aux totaux existants, sans modifier les sous-contentieux
   * ni recalculer leurs stocks. La visibilité ne détermine pas la participation au total.
   * @param {number} contentieuxId contentieux parent
   */
  Model.recalculateTotalsByContentieux = async (contentieuxId) => {
    const parents = await Model.findAll({
      where: { contentieux_id: contentieuxId },
      raw: true,
    })

    for (const backupId of new Set(parents.map((parent) => parent.hr_backup_id))) {
      const referentiels = await Model.models.ContentieuxReferentiels.getReferentiels(backupId)
      const ref = referentiels.find((item) => item.id === contentieuxId)
      if (!ref) continue

      const childrens = ref.childrens || []
      const countedIds = childrens.filter((child) => child.compter === true).map((child) => child.id)
      const activities = countedIds.length
        ? await Model.findAll({
          where: { hr_backup_id: backupId, contentieux_id: countedIds },
          raw: true,
        })
        : []
      const byMonth = new Map()
      for (const activity of activities) {
        const key = month(activity.periode).getTime()
        if (!byMonth.has(key)) byMonth.set(key, [])
        byMonth.get(key).push(activity)
      }

      for (const parent of parents.filter((item) => item.hr_backup_id === backupId)) {
        const totals = calculMainValuesFromChilds(byMonth.get(month(parent.periode).getTime()) || [], childrens)
        if (Object.keys(totals).some((key) => parent[key] !== totals[key])) {
          await Model.updateById(parent.id, totals)
        }
      }
    }
  }

  Model.syncAllActivitiesByContentieux = async (contentieuxId, juridictionsIds) => {
    for (let i = 0; i < juridictionsIds.length; i++) {
      await Model.cleanActivities(juridictionsIds[i], null, true, [contentieuxId])
    }
  }

  return Model
}
