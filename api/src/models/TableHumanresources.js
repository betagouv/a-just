import { Op } from 'sequelize'
import { posad } from '../constants/hr'
import { ETP_NEED_TO_BE_UPDATED } from '../constants/referentiel'
import { getNbMonth, today } from '../utils/date'
import { snakeToCamelObject } from '../utils/utils'
import config from 'config'
import { EXECUTE_CALCULATOR } from '../constants/log-codes'
import { emptyCalulatorValues, syncCalculatorDatas } from '../utils/calculator'
import { orderBy } from 'lodash'
import { checkAbort } from '../utils/abordTimeout'
import { generateHRIndexes, loadFonctionsForCategory, loadReferentiels } from '../utils/human-resource'
import { cleanCalculationItemForUser } from '../utils/hrAccess'
import { getFullKey, getRedisClient, loadOrWarmHR, removeCacheListItem, updateCacheListItem, waitForRedis } from '../utils/redis'

export default (sequelizeInstance, Model) => {
  Model.asyncForEach = async (array, fn) => {
    for (let i = 0; i < array.length; i++) {
      await fn(array[i], i)
    }
  }

  Model.forceRecalculateAllHrCache = async () => {
    await waitForRedis()
    const redis = getRedisClient()

    if (!redis?.isReady) {
      console.warn('⚠️ Redis non prêt, recalcul forcé ignoré.')
      return
    }

    console.log(`🚀 Recalcul forcé du cache HR pour toutes les juridictions @ ${new Date().toISOString()}`)
    console.time('forceRecalculateAllHrCache')

    const jurisdictions = await Model.getAllJuridictionsWithSizes()
    const maxAtOnce = 5

    const chunks = Array.from({ length: Math.ceil(jurisdictions.length / maxAtOnce) }, (_, i) => jurisdictions.slice(i * maxAtOnce, (i + 1) * maxAtOnce))

    for (const chunk of chunks) {
      await Model.asyncForEach(chunk, async (jur) => {
        const jurId = jur.id
        try {
          const fullKey = getFullKey('hrBackup', jurId)

          // Suppression du cache existant
          await redis.del(fullKey)

          // Recalcul et stockage dans le cache
          await loadOrWarmHR(jurId, Model.models)
        } catch (err) {
          console.error(`❌ Juridiction ${jurId} échouée :`, err)
        }
      })

      // Pause légère entre les batchs
      await Model.sleep(100)
    }

    console.timeEnd('forceRecalculateAllHrCache')
    console.log('✅ Recalcul complet du cache HR terminé')
  }

  Model.sleep = (ms) => new Promise((res) => setTimeout(res, ms))

  /**
   * Retour des détails d'une juridiction
   * @param {*} backupId
   * @returns
   */
  Model.getCurrentHr = async (backupId, signal = null) => {
    checkAbort(signal)
    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'matricule', 'date_entree', 'date_sortie', 'backup_id', 'cover_url', 'updated_at', 'juridiction'],
      where: {
        backup_id: backupId,
      },
      raw: true,
    })
    checkAbort(signal)

    for (let i = 0; i < list.length; i++) {
      checkAbort(signal)
      const comment = await Model.models.HRComments.getLastComment(list[i].id)
      list[i] = {
        id: list[i].id,
        firstName: list[i].first_name,
        lastName: list[i].last_name,
        matricule: list[i].matricule,
        dateStart: list[i].date_entree,
        dateEnd: list[i].date_sortie,
        coverUrl: list[i].cover_url,
        updatedAt: list[i].updated_at,
        backupId: list[i].backup_id,
        juridiction: list[i].juridiction,
        comment: comment && comment.comment,
        situations: await Model.models.HRSituations.getListByHumanId(list[i].id, list[i].date_entree),
        indisponibilities: await Model.models.HRIndisponibilities.getAllByHR(list[i].id),
      }
    }

    return list.filter((h) => h.situations && h.situations.length) // remove hr without situation
  }

  /**
   * Retour des détails d'une juridiction
   * @param {*} backupId
   * @returns
   */
  Model.getCurrentHrNew = async (backupId) => {
    // 1. REQUÊTE PRINCIPALE
    const hrList = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'matricule', 'date_entree', 'date_sortie', 'backup_id', 'cover_url', 'updated_at', 'juridiction'],
      where: { backup_id: backupId },
      include: [
        // Situation avec association
        {
          model: Model.models.HRSituations,
          required: true,
          attributes: ['id', 'etp', 'date_start', 'category_id', 'fonction_id'],
          include: [
            {
              model: Model.models.HRCategories,
            },
            {
              model: Model.models.HRFonctions,
            },
            {
              model: Model.models.HRActivities,
              include: [
                {
                  model: Model.models.ContentieuxReferentiels,
                },
              ],
            },
          ],
        },
        // Commentaire
        {
          model: Model.models.HRComments,
          separate: true,
          order: [['created_at', 'DESC']],
          limit: 1,
          include: [
            {
              model: Model.models.Users,
            },
          ],
        },
        // Indisponibilités
        {
          model: Model.models.HRIndisponibilities,
          separate: true,
          include: [
            {
              model: Model.models.ContentieuxReferentiels,
            },
          ],
        },
      ],
      subQuery: false,
    })

    // 2. TRANSFORMATION DES DONNÉES
    return hrList
      .map((hr) => {
        // Traitement des situations
        const situationsMap = new Map()
        hr.HRSituations.sort((a, b) => new Date(b.date_start) - new Date(a.date_start) || b.id - a.id).forEach((sit) => {
          const dateS = sit.date_start && new Date(hr.date_entree) > new Date(sit.date_start) ? hr.date_entree : sit.date_start

          const dateKey = today(dateS).getTime()

          if (!situationsMap.has(dateKey)) {
            situationsMap.set(dateKey, {
              id: sit.id,
              etp: sit.etp,
              dateStart: today(dateS),
              dateStartTimesTamps: dateKey,
              category: sit.HRCategory
                ? {
                    id: sit.HRCategory.id,
                    rank: sit.HRCategory.rank,
                    code: sit.HRCategory.code,
                    label: sit.HRCategory.label,
                  }
                : null,
              fonction: sit.HRFonction
                ? {
                    id: sit.HRFonction.id,
                    rank: sit.HRFonction.rank,
                    code: sit.HRFonction.code,
                    label: sit.HRFonction.label,
                    category_detail: sit.HRFonction.category_detail,
                    position: sit.HRFonction.position,
                    calculatriceIsActive: sit.HRFonction.calculatrice_is_active,
                  }
                : null,
              activities: sit.HRActivities.filter((act) => act.ContentieuxReferentiel !== null).map((act) => {
                return {
                  id: act.id,
                  percent: act.percent,
                  contentieux: {
                    id: act.ContentieuxReferentiel.id,
                    label: act.ContentieuxReferentiel.label,
                  },
                }
              }),
            })
          }
        })

        // Dernier commentaire
        const lastComment = hr.HRComments[0]
        const comment = lastComment ? lastComment.comment : null

        // Indisponibilités
        const indisponibilities = orderBy(
          hr.HRIndisponibilities.map((ind) => ({
            id: ind.id,
            percent: ind.percent,
            dateStart: ind.date_start,
            dateStartTimesTamps: today(ind.date_start).getTime(),
            dateStop: ind.date_stop,
            dateStopTimesTamps: ind.date_stop ? today(ind.date_stop).getTime() : null,
            contentieux: {
              id: ind.ContentieuxReferentiel.id,
              label: ind.ContentieuxReferentiel.label,
              checkVentilation: ind.ContentieuxReferentiel.check_ventilation,
            },
          })),
          'dateStart',
          ['desc'],
        )

        // Structure finale
        return {
          id: hr.id,
          firstName: hr.first_name,
          lastName: hr.last_name,
          matricule: hr.matricule,
          dateStart: hr.date_entree,
          dateEnd: hr.date_sortie,
          coverUrl: hr.cover_url,
          updatedAt: hr.updated_at,
          backupId: hr.backup_id,
          juridiction: hr.juridiction,
          comment: comment,
          situations: Array.from(situationsMap.values()),
          indisponibilities: indisponibilities,
        }
      })
      .filter((hr) => hr.situations.length > 0)
  }

  /**
   * Retour des détails d'une fiche
   * @param {*} hrId
   * @returns
   */
  Model.getHrDetails = async (hrId) => {
    const details = await Model.findOne({
      attributes: ['id', 'first_name', 'last_name', 'matricule', 'date_entree', 'date_sortie', 'backup_id', 'cover_url', 'updated_at', 'created_at'],
      where: {
        id: hrId,
      },
      raw: true,
    })

    if (details) {
      const comment = await Model.models.HRComments.getLastComment(details.id)
      return {
        id: details.id,
        firstName: details.first_name,
        lastName: details.last_name,
        matricule: details.matricule,
        dateStart: details.date_entree,
        dateEnd: details.date_sortie,
        coverUrl: details.cover_url,
        createdAt: details.created_at,
        updatedAt: details.updated_at,
        backupId: details.backup_id,
        comment: comment && comment.comment,
        situations: await Model.models.HRSituations.getListByHumanId(details.id, details.date_entree),
        indisponibilities: await Model.models.HRIndisponibilities.getAllByHR(details.id),
      }
    }

    return null
  }

  /**
   * Import une liste de fiche et auto affectation à des juridictions
   * @param {*} list
   */
  Model.importList = async (list) => {
    const now = new Date()
    const ids = []
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const filterBySP = ['MHFJS', 'MHFJ', 'AS', 'JA']
    const notImported = ['PPI', 'ADJ', 'MHFNJ', 'MTT', 'MRES']
    const filterNoEtpt = ['AS', 'JA']
    const privilegedInGreff = ['CONT A JP', 'CONT A VIF JP', 'CONT B JP', 'CONT B VIF JP', 'CONT C JP', 'CONT C VIF JP']
    const findEAM = await Model.models.HRCategories.findOne({
      where: {
        label: 'Autour du magistrat',
      },
      logging: false,
    })

    const importSituation = []
    for (let i = 0; i < list.length; i++) {
      const backupId = await Model.models.HRBackups.findOrCreateLabel(Number(config.juridictionType) !== 1 ? list[i].arrdt : list[i].juridiction)
      if (!ids.includes(backupId)) {
        ids.push(backupId)
      }

      list[i].hRegMatricule = (list[i].hmatricule || '') + (list[i].nom_usage || '') + (list[i].prenom || '')
      let findHRToDB = await Model.findOne({
        where: {
          backup_id: backupId,
          registration_number: list[i].hRegMatricule,
        },
        logging: false,
      })

      if (!findHRToDB) {
        // prepare ventilation
        const situation = {
          fonction_id: null,
          category_id: null,
          etp: 1,
          date_start: today,
        }

        let statut = list[i].statut
        switch (statut) {
          case 'Fonctionnaire':
            statut = 'Greffe'
            break
        }
        const findCategory = await Model.models.HRCategories.findOne({
          where: {
            label: statut,
          },
          logging: false,
        })

        let code = list[i][statut === 'Magistrat' ? 'fonction' : 'categorie']

        //console.log('findCategory', findCategory)
        if (findCategory) {
          if (filterNoEtpt.includes(list[i].fonction) || privilegedInGreff.includes(list[i].grade)) {
            situation.category_id = findEAM.id

            // fix https://trello.com/c/pdZrOSqJ/651-creation-dune-juridiction-pbm-dimport-des-fonctionnaires
            switch (list[i].grade) {
              case 'CONT A VIF JP':
                code = 'CONT A JP'
                break
              case 'CONT B VIF JP':
                code = 'CONT B JP'
                break
              case 'CONT C VIF JP':
                code = 'CONT C JP'
                break
              default:
                code = list[i].grade
                break
            }
          } else situation.category_id = findCategory.id
        }

        let findHRToDBByMatricule = await Model.findOne({
          where: {
            backup_id: backupId,
            matricule: list[i].hmatricule,
          },
          logging: false,
        })

        if (list[i].hmatricule !== '' && list[i].hmatricule !== '0' && findHRToDBByMatricule) {
          importSituation.push(list[i].hmatricule + ' no add by matricule already existing')
          continue
        }

        switch (code) {
          case 'MHFJS':
            code = 'MHFJ'
            break
          case 'ATT A':
            code = 'CHCAB'
            break
          case 'JA JP':
            code = 'JA'
            break
          case 'CONT B IFPA':
            code = 'CONT B'
            break
        }

        if (list[i].categorie == 'CB') {
          switch (list[i].grade) {
            case 'CONT A':
            case 'CONT B':
            case 'CONT C':
            case 'CONT CB':
            case 'CONT CJ':
              code = list[i].grade
              break
            case 'CONTCB1C':
              code = 'CONT CB'
              break
          }
        }

        if (list[i].categorie === 'CT' && list[i].grade === 'CONT CT') {
          code = 'CT'
        }

        if (code.startsWith('AS')) {
          code = 'AS'
        }

        if (filterBySP.includes(code) && list[i]['s/p'] === 'P') {
          importSituation.push(list[i].nom_usage + ' no add by S/P because P')
          continue
        }

        if (list[i].fonction === 'C CAB CC') {
          // pour CA
          code = 'CHCAB'
        } else if (list[i].fonction === 'DG') {
          code = 'DG'
        }

        switch (list[i].grade) {
          case 'DSG':
            code = 'DSGJ'
            break
          case 'G PR': // CA
          case 'GR':
            code = 'B'
            break
        }

        if (list[i].grade.startsWith('DSG')) {
          code = 'DSGJ'
        } else if (list[i].grade.startsWith('SA')) {
          code = 'SA'
        }

        let findFonction = await Model.models.HRFonctions.findOne({
          where: {
            code,
            category_id: situation.category_id,
          },
          logging: false,
        })

        //console.log('findFonction', code, findFonction)

        if (findFonction) {
          situation.fonction_id = findFonction.id
        } else if (statut === 'Magistrat' || notImported.includes(code)) {
          console.log('code no imported=>', code, statut)
          // dont save this profil
          importSituation.push(list[i].nom_usage + ' no add by fonction ')
          continue
        }

        const etp = posad[list[i].posad.toLowerCase()]
        if (etp) {
          situation.etp = etp
        } else {
          if (code === 'MHFJ' && list[i]['posad'] === 'RET') {
            //situation.etp = null
          } else if (filterNoEtpt.includes(code)) {
            //situation.etp = null
          } else {
            // dont save this profil
            importSituation.push(list[i].nom_usage + ' no add by etp')
            continue
          }
        }

        // control ETP to complete
        const gradeToETPComplete = ['MTT', 'MHFJ', 'MHFJS', 'MHFNJ', 'MRES', 'VAC', 'GRES', 'PPI', 'ADJ']
        if (gradeToETPComplete.indexOf(list[i].fonction) !== -1) {
          situation.etp = ETP_NEED_TO_BE_UPDATED
        }

        let updatedAt = new Date()
        const dateUpdatedSplited = (list[i].date_modif || '').split('/')
        if (dateUpdatedSplited.length === 3) {
          updatedAt = new Date(dateUpdatedSplited[2], +dateUpdatedSplited[1] - 1, dateUpdatedSplited[0])
        }

        let juridiction = list[i].juridiction || ''
        /*if (Number(config.juridictionType) !== 1)
          if (juridictionLabelExceptions.map((x) => x['import'].includes(juridiction)))
            juridiction = juridictionLabelExceptions.filter((el) => {
              return el['import'] === juridiction
            })[0]['ielst']*/

        // prepare person
        const options = {
          first_name: list[i].prenom || '',
          last_name: list[i].nom_usage || list[i].nom_marital || list[i].nom || '',
          matricule: list[i].hmatricule || '',
          backup_id: backupId,
          registration_number: list[i].hRegMatricule,
          updated_at: updatedAt,
          juridiction: list[i].juridiction || '',
        }

        const cleanDate = (dateStr) => dateStr.replace(/#/, '').split('/').map(Number)

        const dateAff = cleanDate(list[i].date_aff)
        const dateAffHAC = cleanDate(list[i].date_aff_hors_anc_cons)

        if (dateAffHAC.length === 3 && dateAff.length === 3) {
          const date1 = new Date(dateAff[2], dateAff[1] - 1, dateAff[0])
          const date2 = new Date(dateAffHAC[2], dateAffHAC[1] - 1, dateAffHAC[0])

          if (date1 > date2) {
            options.date_entree = situation.date_start = date2
          } else {
            options.date_entree = situation.date_start = date1
          }
        }

        // create person
        findHRToDB = await Model.create(options)

        // create
        await Model.models.HRSituations.create({
          ...situation,
          human_id: findHRToDB.dataValues.id,
        })

        importSituation.push(list[i].nom_usage + ' ADDED')
      } else {
        // force to save juridiction
        await findHRToDB.update({
          juridiction: list[i].juridiction || '',
        })
        importSituation.push(list[i].nom_usage + ' no add by exist')
      }
    }

    // remove cache
    console.log('IMPORT!:', importSituation)
    return ids
  }

  /**
   * Control si une utilisateur a accès à une fiche
   * @param {*} HRId
   * @param {*} userId
   * @returns
   */
  Model.haveAccess = async (HRId, userId) => {
    const hr = await Model.findOne({
      attributes: ['id'],
      where: {
        id: HRId,
      },
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
      raw: true,
    })

    return hr ? true : false
  }

  /**
   * Mise à jour d'une fiche
   * @param {*} hr
   * @param {*} backupId
   * @returns
   */
  Model.updateHR = async (hr, backupId) => {
    const options = {
      first_name: hr.firstName || null,
      last_name: hr.lastName || null,
      matricule: hr.matricule || null,
      registrationId: hr.registration_number || null,
      date_entree: hr.dateStart || null,
      date_sortie: hr.dateEnd || null,
      backup_id: backupId,
      updated_at: new Date(),
    }

    if (hr.id && hr.id > 0) {
      // update
      await Model.updateById(hr.id, options)
    } else {
      // create
      const newHr = await Model.create(options)
      hr.id = newHr.dataValues.id
    }

    await Model.models.HRSituations.syncSituations(hr.situations || [], hr.id)
    await Model.models.HRBackups.updateById(backupId, { updated_at: new Date() })
    await Model.models.HRIndisponibilities.syncIndisponibilites(hr.indisponibilities || [], hr.id)

    const newHr = await Model.getHr(hr.id)
    return newHr
  }

  /**
   * Retour complet d'une fiche
   * @param {*} hrId
   * @returns
   */
  Model.getHr = async (hrId) => {
    let hr = await Model.findOne({
      attributes: ['id', 'first_name', 'last_name', 'matricule', 'registration_number', 'date_entree', 'date_sortie', 'backup_id', 'cover_url', 'updated_at'],
      where: {
        id: hrId,
      },
      raw: true,
    })

    if (hr) {
      const comment = await Model.models.HRComments.getLastComment(hr.id)
      hr = {
        id: hr.id,
        firstName: hr.first_name,
        lastName: hr.last_name,
        matricule: hr.matricule,
        registrationId: hr.registration_number,
        dateStart: hr.date_entree,
        dateEnd: hr.date_sortie,
        coverUrl: hr.cover_url,
        updatedAt: hr.updated_at,
        comment: comment && comment.comment,
        backupId: hr.backup_id,
        situations: await Model.models.HRSituations.getListByHumanId(hr.id, hr.date_entree),
        indisponibilities: await Model.models.HRIndisponibilities.getAllByHR(hr.id),
      }
    }

    // save to cache
    await updateCacheListItem(hr.backupId, 'hrBackup', hr)

    return hr
  }

  /**
   * Suppression d'une fiche et se ses éléments rattachés
   * @param {*} hrId
   * @returns
   */
  Model.removeHR = async (hrId) => {
    const hrFromDB = await Model.findOne({
      attributes: ['id', 'backup_id'],
      where: {
        id: hrId,
      },
      raw: true,
    })

    if (hrFromDB) {
      const camelCaseReturn = snakeToCamelObject(hrFromDB)
      // control if have existing situations

      const situations = await Model.models.HRSituations.getListByHumanId(hrId)
      if (situations.length) {
        return false
      }

      await Model.models.HRBackups.updateById(camelCaseReturn.backupId, { updated_at: new Date() })

      await Model.destroy({
        where: {
          id: hrId,
        },
      })

      // delete force all references
      await Model.models.HRVentilations.destroy({
        where: {
          rh_id: hrId,
        },
        force: true,
      })

      // delete force all situations
      await Model.models.HRSituations.destroy({
        where: {
          human_id: hrId,
        },
        force: true,
      })

      // remove to cache
      await removeCacheListItem(camelCaseReturn.backupId, 'hrBackup', hrId)
      return camelCaseReturn
    } else {
      return false
    }
  }

  /**
   * Suppression d'une fiche et se ses éléments rattachés (For test only)
   * @param {*} hrId
   * @returns
   */
  Model.removeHRTest = async (hrId) => {
    if (process.env.NODE_ENV !== 'test') {
      ctx.throw(401, "Cette route n'est pas disponible")
      return
    }

    const hrFromDB = await Model.findOne({
      attributes: ['id', 'backup_id'],
      where: {
        id: hrId,
      },
      raw: true,
    })
    if (hrFromDB) {
      const camelCaseReturn = snakeToCamelObject(hrFromDB)
      // control if have existing situations
      const situations = await Model.models.HRSituations.getListByHumanId(hrId)
      if (situations.length) {
        return false
      }

      await Model.models.HRBackups.updateById(hrFromDB.backup_id, { updated_at: new Date() })

      await Model.destroy({
        where: {
          id: hrId,
        },
        force: true,
      })

      // delete force all references
      await Model.models.HRVentilations.destroy({
        where: {
          rh_id: hrId,
        },
        force: true,
      })

      // delete force all situations
      await Model.models.HRSituations.destroy({
        where: {
          human_id: hrId,
        },
        force: true,
      })

      // remove to cache
      //Model.removeCacheByUser(hrId, camelCaseReturn.backupId)

      return camelCaseReturn
    } else {
      return false
    }
  }

  Model.checkAgentToAnonymise = async () => {
    const now = today()
    now.setFullYear(now.getFullYear() - 5)
    const agents = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'date_sortie', 'matricule', 'registration_number'],
      where: {
        date_sortie: {
          [Op.lte]: now,
        },
        first_name: {
          [Op.ne]: 'anonyme',
        },
      },
      paranoid: false,
    })

    for (let i = 0; i < agents.length; i++) {
      await agents[i].update({
        first_name: 'anonyme',
        last_name: 'anonyme',
        matricule: 'anonyme',
        registration_number: 'anonyme',
      })
    }
  }

  Model.onCalculate = async ({ backupId, dateStart, dateStop, contentieuxIds, optionBackupId, categorySelected, selectedFonctionsIds }, user, log = true) => {
    console.time('Calculator-global')

    dateStart = today(dateStart)
    dateStop = today(dateStop)

    if (!selectedFonctionsIds && user && log === true) {
      // memorize first execution by user
      await Model.models.Logs.addLog(EXECUTE_CALCULATOR, user.id)
    }

    const categories = await Model.models.HRCategories.getAll()
    const fonctions = await loadFonctionsForCategory(categorySelected, Model.models)
    const referentiels = await loadReferentiels(backupId, contentieuxIds, Model.models)
    const activities = await Model.models.Activities.getAll(backupId)
    const optionsBackups = optionBackupId ? await Model.models.ContentieuxOptions.getAllById(optionBackupId) : [] // référentiel de temps moyen
    const nbMonth = getNbMonth(dateStart, dateStop)

    let list = emptyCalulatorValues(referentiels)

    console.time('Mise en cache')
    const hr = await loadOrWarmHR(backupId, Model.models)
    console.timeEnd('Mise en cache')

    console.time('🧩 Pré-formatage / Indexation')
    const indexes = await generateHRIndexes(hr)
    console.timeEnd('🧩 Pré-formatage / Indexation')

    console.time('Calculs cockpit')
    list = syncCalculatorDatas(indexes, list, nbMonth, activities, dateStart, dateStop, hr, categories, optionsBackups)
    list = list.map((item) => ({
      ...cleanCalculationItemForUser(item, user),
      childrens: (item.childrens || []).map((child) => cleanCalculationItemForUser(child, user)),
    }))
    console.timeEnd('Calculs cockpit')
    console.timeEnd('Calculator-global')

    return { fonctions, list }
  }

  Model.getAllJuridictionsWithSizes = async (sequelize) => {
    const results = await Model.sequelize.query(
      `
      SELECT backup_id AS id, COUNT(*) AS size
      FROM "HumanResources"
      WHERE deleted_at IS NULL
      GROUP BY backup_id
      ORDER BY size DESC
      `,
      {
        type: Model.sequelize.QueryTypes.SELECT,
      },
    )

    return results.map(({ id, size }) => ({ id: Number(id), size: Number(size) }))
  }

  return Model
}
