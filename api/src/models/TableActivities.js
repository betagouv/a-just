import { endOfMonth, startOfMonth } from 'date-fns'
import { Op } from 'sequelize'
import { calculMainValuesFromChilds, compareGapBetweenData, preformatActivitiesArray } from '../utils/activities'
import { month, today } from '../utils/date'
import { maxBy } from 'lodash'
import { VALUE_QUALITY_OPTION, VALUE_QUALITY_TO_VERIFY } from '../constants/activities'

/**
 * Scripts intermediaires entre la table d'activités (entrees, sorties, stock)
 */

export default (sequelizeInstance, Model) => {
  /**
   * Retourne la date du dernière stock pour une juridiction
   * @param {*} HRBackupId
   * @returns
   */
  Model.getLastMonth = async (HRBackupId) => {
    const theLast = await Model.findOne({
      attributes: ['periode'],
      where: {
        hr_backup_id: HRBackupId,
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
   * Retour la liste de l'ensemble des activités d'une jurdicition
   * @param {*} HRBackupId
   * @returns
   */
  Model.getAll = async (HRBackupId, refIds = null) => {
    const whereCon = {}
    if (refIds) {
      whereCon.id = refIds
    }

    const list = await Model.findAll({
      attributes: ['id', 'periode', 'entrees', 'sorties', 'stock', 'original_entrees', 'original_sorties', 'original_stock'],
      where: {
        hr_backup_id: HRBackupId,
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

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        periode: list[i].periode,
        entrees: list[i].entrees !== null ? list[i].entrees : list[i].original_entrees,
        sorties: list[i].sorties !== null ? list[i].sorties : list[i].original_sorties,
        stock: list[i].stock !== null ? list[i].stock : list[i].original_stock,
        contentieux: {
          id: list[i]['ContentieuxReferentiel.id'],
          label: list[i]['ContentieuxReferentiel.label'],
          code_import: list[i]['ContentieuxReferentiel.code_import'],
        },
      }
    }

    return list
  }

  /**
   * Retour la liste de l'ensemble des activités d'une jurdicition avec le détail des sorties
   * @param {*} HRBackupId
   * @returns
   */
  Model.getAllDetails = async (HRBackupId) => {
    const list = await Model.findAll({
      attributes: ['periode', 'entrees', 'sorties', 'stock', 'original_entrees', 'original_sorties', 'original_stock'],
      where: {
        hr_backup_id: HRBackupId,
      },
      include: [
        {
          attributes: ['id', 'label', 'code_import'],
          model: Model.models.ContentieuxReferentiels,
        },
      ],
      order: [['periode', 'asc']],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i] = {
        id: list[i].id,
        periode: list[i].periode,
        entrees: list[i].entrees,
        sorties: list[i].sorties,
        stock: list[i].stock,
        originalEntrees: list[i].original_entrees,
        originalSorties: list[i].original_sorties,
        originalStock: list[i].original_stock,
        idReferentiel: list[i]['ContentieuxReferentiel.id'],
        contentieux: {
          id: list[i]['ContentieuxReferentiel.id'],
          label: list[i]['ContentieuxReferentiel.label'],
          code_import: list[i]['ContentieuxReferentiel.code_import'],
        },
      }
    }

    return list
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
      console.log('FORCE TO DELETE', activitiesToDeleted.length)
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
        console.log('DUPPLICATE', duplicateActivities[0].dataValues)
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
    let referentiels = await Model.models.ContentieuxReferentiels.getReferentiels(HRBackupId, false, filterReferentiels)
    //await Model.removeDuplicateDatas(HRBackupId) // TROUVER POURQUOI !

    console.log('MIN PERIODE', HRBackupId, minPeriode)

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

    console.log('START', referentiels, HRBackupId, minPeriode)

    for (let i = 0; i < referentiels.length; i++) {
      await Model.updateTotalAndFuturValue(referentiels[i].id, minPeriode, HRBackupId)
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

    console.log(values)

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
      console.log('create', {
        ...values,
        hr_backup_id: hrBackupId,
        contentieux_id: contentieuxId,
        periode: date,
      })
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
        await Model.models.HistoriesActivitiesUpdate.addHistory(userId, findActivity.dataValues.id, nodeUpdated, null)
      else await Model.models.HistoriesActivitiesUpdate.addHistory(userId, findActivity.dataValues.id, nodeUpdated, values[nodeUpdated])
    }

    const referentiels = await Model.models.ContentieuxReferentiels.getReferentiels(hrBackupId, false, null, false, false, userId)
    const ref = referentiels.find((r) => (r.childrens || []).find((c) => c.id === contentieuxId))

    if (ref) {
      await Model.updateTotalAndFuturValue(ref.id, date, hrBackupId)
    }
  }

  /**
   * Calcul les nouveaux entrées, sorties niveau 3 et les stocks de niveau 3 et 4
   * @param {*} mainContentieuxId
   * @param {*} date
   * @param {*} hrBackupId
   */
  Model.updateTotalAndFuturValue = async (mainContentieuxId, date, hrBackupId) => {
    date = new Date(date) // detach date reference
    const referentiels = await Model.models.ContentieuxReferentiels.getReferentiels(hrBackupId, false, null, false, false, userId)
    const ref = referentiels.find((r) => r.id === mainContentieuxId)

    if (ref) {
      let continueToDo = false
      do {
        const childrens = ref.childrens || []

        for (let cIndex = 0; cIndex < childrens.length; cIndex++) {
          // IF not exist, create it
          if (
            !(await Model.findOne({
              where: {
                periode: {
                  [Op.between]: [startOfMonth(date), endOfMonth(date)],
                },
                hr_backup_id: hrBackupId,
                contentieux_id: childrens[cIndex].id,
              },
            }))
          ) {
            await Model.create({
              periode: date,
              hr_backup_id: hrBackupId,
              contentieux_id: childrens[cIndex].id,
            })
          }
        }

        // update main activity with entrees, sorties, stock
        const findAllChild = await Model.findAll({
          where: {
            periode: {
              [Op.between]: [startOfMonth(date), endOfMonth(date)],
            },
            hr_backup_id: hrBackupId,
            contentieux_id: ref.childrens.map((r) => r.id),
          },
          raw: true,
        })

        // calcul stock of custom stock
        for (let i = 0; i < findAllChild.length; i++) {
          let currentStock = findAllChild[i].stock
          // if exist stock and is updated by user do not get previous stock
          const getUserUpdateStock = await Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(findAllChild[i].id, 'stock')

          const contentieuxRef = await Model.models.ContentieuxReferentiels.getOneReferentiel(findAllChild[i].contentieux_id)
          // do not update if updated by user
          // or if stock is 'A_verifier'
          if ((!getUserUpdateStock || getUserUpdateStock.value === null) && contentieuxRef.dataValues.value_quality_stock !== VALUE_QUALITY_TO_VERIFY) {
            const previousStockValue = await Model.checkAndUpdatePreviousStock(findAllChild[i].contentieux_id, date, hrBackupId)

            if (previousStockValue !== null) {
              // Si il y a un stock sur le mois précédent:
              // Si c'est une donnée calculé -> stock N calculé = stock N-1 ajusté + entrees N ajusté - sorties N ajusté(où N = mois en cours)
              // Sinon -> stock N calculé = stock N logiciel (original) + (entrees N ajusté - entrées N logiciel) - (sorties N ajusté - sorties N logiciel)
              if (findAllChild[i].entrees !== null || findAllChild[i].sorties !== null || previousStockValue.type === 'calculate') {
                const entrees = preformatActivitiesArray([findAllChild[i]], ['entrees', 'original_entrees'])
                const sorties = preformatActivitiesArray([findAllChild[i]], ['sorties', 'original_sorties'])

                if (previousStockValue.type === 'calculate') {
                  const stock = previousStockValue.stock ?? 0
                  currentStock = (stock ?? 0) + (entrees ?? 0) - (sorties ?? 0)
                } else {
                  const stock = preformatActivitiesArray([findAllChild[i]], ['original_stock'])
                  currentStock = (stock ?? 0) + (entrees - (findAllChild[i].original_entrees ?? 0)) - (sorties - (findAllChild[i].original_sorties ?? 0))
                }
              } else {
                currentStock = findAllChild[i].original_stock
              }
            } else if (findAllChild[i].original_stock !== null) {
              // Update stock with original stock ONLY IF not null
              currentStock = findAllChild[i].original_stock

              if (findAllChild[i].entrees !== null) {
                currentStock += findAllChild[i].entrees || 0
              } else if (findAllChild[i].original_entrees !== null && findAllChild[i].sorties !== null) {
                currentStock += findAllChild[i].original_entrees || 0
              }

              if (findAllChild[i].sorties !== null) {
                currentStock -= findAllChild[i].sorties || 0
              } else if (findAllChild[i].original_sorties !== null && findAllChild[i].entrees !== null) {
                currentStock -= findAllChild[i].original_sorties || 0
              }
            }

            // Si le stock calculé est égal au stock original
            if (currentStock === findAllChild[i].original_stock) {
              // Si c'est un stock à vérifier ET qu'il y a des mouvements (entrées/sorties)
              // alors on garde le stock calculé tel quel
              if (
                contentieuxRef.dataValues.value_quality_stock === VALUE_QUALITY_TO_VERIFY &&
                (findAllChild[i].entrees !== null || findAllChild[i].sorties !== null)
              ) {
                // currentStock reste inchangé (pas d'action nécessaire)
              }
              // Sinon, si le stock précédent n'est pas calculé, on remet à null
              else if (!previousStockValue || previousStockValue.type !== 'calculate') {
                currentStock = null
              }
              // Si previousStockValue.type === 'calculate', currentStock reste inchangé
            }

            if (currentStock !== null && currentStock < 0) {
              currentStock = 0
            }

            // save to database
            findAllChild[i].stock = currentStock
            await Model.updateById(findAllChild[i].id, {
              stock: currentStock,
            })
          }
        }

        const findMain = await Model.findOne({
          where: {
            periode: {
              [Op.between]: [startOfMonth(date), endOfMonth(date)],
            },
            hr_backup_id: hrBackupId,
            contentieux_id: ref.id,
          },
        })

        let contentieuxRefChildren = []
        for (let elem of findAllChild) {
          let ref = await Model.models.ContentieuxReferentiels.getOneReferentiel(elem.contentieux_id)
          contentieuxRefChildren.push(ref.dataValues)
        }

        if (findMain) {
          await findMain.update(calculMainValuesFromChilds(findAllChild))
        } else {
          await Model.create({
            periode: date,
            hr_backup_id: hrBackupId,
            contentieux_id: ref.id,
            ...calculMainValuesFromChilds(findAllChild),
          })
        }

        // check if they are value after this periode
        const nextPeriode = await Model.findAll({
          attributes: ['periode'],
          where: {
            periode: {
              [Op.gt]: endOfMonth(date),
            },
            hr_backup_id: hrBackupId,
          },
          raw: true,
          order: ['periode'],
        })
        continueToDo = nextPeriode.length !== 0
        if (nextPeriode.length) {
          date.setMonth(date.getMonth() + 1)
        }
      } while (continueToDo)
    }
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

  Model.getByMonthNew = async (date, HrBackupId, contentieuxId = null, details = true) => {
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
        hr_backup_id: HrBackupId,
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
    const commentsMap = await Model.models.Comments.getNbByActivityTypes(contentieuxIds, HrBackupId)

    // ⏬ Construction finale avec mêmes valeurs que l’ancienne méthode
    return await Promise.all(
      rawActivities.map(async (row) => {
        const contentieuxId = row['ContentieuxReferentiel.id']
        const activityId = row.id

        let updatedBy = null

        if (details) {
          const [entrees, sorties, stock] = await Promise.all([
            Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(activityId, 'entrees'),
            Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(activityId, 'sorties'),
            Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(activityId, 'stock'),
          ])

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
              entrees: await Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(list[i].id, 'entrees'),
              sorties: await Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(list[i].id, 'sorties'),
              stock: await Model.models.HistoriesActivitiesUpdate.getLastUpdateByActivityAndNode(list[i].id, 'stock'),
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
  Model.getNotCompleteActivities = async (HrBackupId, dateStart, dateEnd, userId) => {
    dateStart = new Date(dateStart)
    dateEnd = new Date(dateEnd)

    let allContentieux = (await Model.models.ContentieuxReferentiels.getReferentiels(HrBackupId, false, null, false, false, userId)) || []
    let list = ((await Model.models.ContentieuxReferentiels.getReferentiels(HrBackupId, false, null, false, false, userId)) || [])
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

      const monthActivitiesContentieuxIds = ((await Model.getByMonthNew(date, HrBackupId, contentieuxToFind)) || [])
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
    console.log('GetOneByMonth')
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

  Model.syncAllActivitiesByContentieux = async (contentieuxId, juridictionsIds) => {
    for (let i = 0; i < juridictionsIds.length; i++) {
      await Model.cleanActivities(juridictionsIds[i], null, true, [contentieuxId])
    }
  }

  return Model
}
