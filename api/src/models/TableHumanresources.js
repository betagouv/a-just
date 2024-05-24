import { posad } from '../constants/hr'
import { juridictionLabelExceptions } from '../constants/juridiction-type'
import { ETP_NEED_TO_BE_UPDATED } from '../constants/referentiel'
import { snakeToCamelObject } from '../utils/utils'
import config from 'config'

/**
 * Cache des juridicitions avec leurs magistrats
 */
let cacheJuridictionPeoples = {}

export default (sequelizeInstance, Model) => {
  /**
   * Chargement des juridictions
   */
  Model.onPreload = async () => {
    if (config.preloadHumanResourcesDatas) {
      const allBackups = await Model.models.HRBackups.getAll()
      for (let i = 0; i < allBackups.length; i++) {
        cacheJuridictionPeoples[allBackups[i].id] = await Model.getCurrentHr(allBackups[i].id)
      }
    }
  }

  /**
   * Suppresion de la fiche d'une juridiction en cache
   * @param {*} humanId
   * @param {*} backupId
   */
  Model.removeCacheByUser = async (humanId, backupId) => {
    const index = (cacheJuridictionPeoples[backupId] || []).findIndex((h) => h.id === humanId)

    if (cacheJuridictionPeoples[backupId] && index !== -1) {
      cacheJuridictionPeoples[backupId].splice(index, 1)
    }
  }

  /**
   * Modification de la fiche d'une juridiction en cache
   * @param {*} human
   */
  Model.updateCacheByUser = async (human) => {
    const backupId = human.backupId
    const index = (cacheJuridictionPeoples[backupId] || []).findIndex((h) => h.id === human.id)

    if (cacheJuridictionPeoples[backupId] && index !== -1) {
      cacheJuridictionPeoples[backupId][index] = human
    } else if (cacheJuridictionPeoples[backupId]) {
      cacheJuridictionPeoples[backupId].push(human)
    } else {
      cacheJuridictionPeoples[backupId] = await Model.getCurrentHr(backupId) // save to cache
    }
  }

  /**
   * Liste des fiches d'une juridiction
   * @param {*} backupId
   * @returns
   */
  Model.getCache = async (backupId) => {
    if (!cacheJuridictionPeoples[backupId]) {
      cacheJuridictionPeoples[backupId] = await Model.getCurrentHr(backupId)
    }

    return cacheJuridictionPeoples[backupId]
  }

  /**
   * Retour des détails d'une juridiction
   * @param {*} backupId
   * @returns
   */
  Model.getCurrentHr = async (backupId) => {
    const list = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'matricule', 'date_entree', 'date_sortie', 'backup_id', 'cover_url', 'updated_at', 'juridiction'],
      where: {
        backup_id: backupId,
      },
      include: [
        {
          attributes: ['id', 'comment'],
          model: Model.models.HRComments,
        },
      ],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
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
        comment: list[i]['HRComment.comment'],
        situations: await Model.models.HRSituations.getListByHumanId(list[i].id, list[i].date_entree),
        indisponibilities: await Model.models.HRIndisponibilities.getAllByHR(list[i].id),
      }
    }

    return list.filter((h) => h.situations && h.situations.length) // remove hr without situation
  }

  /**
   * Retour des détails d'une fiche
   * @param {*} hrId
   * @returns
   */
  Model.getHrDetails = async (hrId) => {
    const details = await Model.findOne({
      attributes: ['id', 'first_name', 'last_name', 'matricule', 'date_entree', 'date_sortie', 'backup_id', 'cover_url', 'updated_at'],
      where: {
        id: hrId,
      },
      include: [
        {
          attributes: ['id', 'comment'],
          model: Model.models.HRComments,
        },
      ],
      raw: true,
    })

    if (details) {
      return {
        id: details.id,
        firstName: details.first_name,
        lastName: details.last_name,
        matricule: details.matricule,
        dateStart: details.date_entree,
        dateEnd: details.date_sortie,
        coverUrl: details.cover_url,
        updatedAt: details.updated_at,
        backupId: details.backup_id,
        comment: details['HRComment.comment'],
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
          }
        }

        if (code.startsWith('AS')) {
          code = 'AS'
        }

        if (filterBySP.includes(code) && list[i]['s/p'] === 'P') {
          importSituation.push(list[i].nom_usage + ' no add by S/P because P')
          continue
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
        console.log('TEST', juridiction, Number(config.juridictionType))
        /*if (Number(config.juridictionType) !== 1)
          if (juridictionLabelExceptions.map((x) => x['import'].includes(juridiction)))
            juridiction = juridictionLabelExceptions.filter((el) => {
              return el['import'] === juridiction
            })[0]['ielst']*/

        // prepare person
        const options = {
          first_name: list[i].prenom || '',
          last_name: list[i].nom_usage || list[i].nom_marital || '',
          matricule: list[i].hmatricule || '',
          backup_id: backupId,
          registration_number: list[i].hRegMatricule,
          updated_at: updatedAt,
          juridiction: list[i].juridiction || '',
        }

        list[i].date_aff = list[i].date_aff.replace(/#/, '')
        const dateSplited = list[i].date_aff.split('/')
        if (dateSplited.length === 3) {
          options.date_entree = new Date(dateSplited[2], +dateSplited[1] - 1, dateSplited[0])
          situation.date_start = new Date(dateSplited[2], +dateSplited[1] - 1, dateSplited[0])
        }

        //console.log(options, situation)

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

    console.log(importSituation)

    // remove cache
    cacheJuridictionPeoples = {}
    Model.onPreload()
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
      include: [
        {
          attributes: ['id', 'comment'],
          model: Model.models.HRComments,
        },
      ],
      raw: true,
    })

    if (hr) {
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
        comment: hr['HRComment.comment'],
        backupId: hr.backup_id,
        situations: await Model.models.HRSituations.getListByHumanId(hr.id, hr.date_entree),
        indisponibilities: await Model.models.HRIndisponibilities.getAllByHR(hr.id),
      }
    }

    // save to cache
    await Model.updateCacheByUser(hr)
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

      await Model.models.HRBackups.updateById(hrFromDB.backup_id, { updated_at: new Date() })

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
      await Model.removeCacheByUser(hrId, camelCaseReturn.backupId)

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
      await Model.removeCacheByUser(hrId, camelCaseReturn.backupId)

      return camelCaseReturn
    } else {
      return false
    }
  }

  return Model
}
